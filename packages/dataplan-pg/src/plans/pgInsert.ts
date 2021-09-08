import debugFactory from "debug";
import type { CrystalResultsList, CrystalValuesList } from "graphile-crystal";
import { ExecutablePlan } from "graphile-crystal";
import { isDev } from "graphile-crystal/src/dev";
import type { SQL, SQLRawValue } from "pg-sql2";
import sql from "pg-sql2";
import { inspect } from "util";

import type { PgSource, PgSourceColumn } from "../datasource";
import type { PgTypeCodec, PgTypedExecutablePlan } from "../interfaces";
import type { PgClassExpressionPlan } from "./pgClassExpression";
import { pgClassExpression } from "./pgClassExpression";

const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([]);
const EMPTY_MAP = new Map<never, never>();

const debugExecute = debugFactory("datasource:pg:PgInsertPlan:execute");

type QueryValueDetailsBySymbol = Map<
  symbol,
  { depId: number; processor: (value: any) => SQLRawValue }
>;

interface PgInsertPlanFinalizeResults {
  /** The SQL query text */
  text: string;

  /** The values to feed into the query */
  rawSqlValues: ReadonlyArray<SQLRawValue>;

  /** When we see the given symbol in the SQL values, what dependency do we replace it with? */
  queryValueDetailsBySymbol: QueryValueDetailsBySymbol;
}

export class PgInsertPlan<
  TDataSource extends PgSource<any, any, any, any, any>,
> extends ExecutablePlan<TDataSource["TRow"]> {
  /**
   * Tells us what we're dealing with - data type, columns, where to insert it,
   * what it's called, etc.
   */
  public readonly source: TDataSource;

  /**
   * This defaults to the name of the source but you can override it. Aids
   * in debugging.
   */
  private readonly name: string;

  /**
   * To be used as the table alias, we always use a symbol unless the calling
   * code specifically indicates a string to use.
   */
  private readonly symbol: symbol | string;

  /** = sql.identifier(this.symbol) */
  public readonly alias: SQL;

  /**
   * The columns and their dependency ids for us to insert.
   */
  private columns: Array<{
    name: keyof TDataSource["columns"];
    depId: number;
    pgCodec: PgTypeCodec;
  }> = [];

  /**
   * The id for the PostgreSQL context plan.
   */
  private contextId: number;

  /**
   * When locked, no more values can be set, no more selects can be added
   */
  private locked = false;

  /**
   * When finalized, we build the SQL query, queryValues, and note where to feed in
   * the relevant queryValues. This saves repeating this work at execution time.
   */
  private finalizeResults: PgInsertPlanFinalizeResults | null = null;

  /**
   * The list of things we're selecting.
   */
  private selects: Array<SQL> = [];
  private selectRecordIndex: number | null = null;

  constructor(
    source: TDataSource,
    columns?: {
      [key in keyof TDataSource["columns"]]?:
        | PgTypedExecutablePlan<TDataSource["columns"][key]["codec"]>
        | { plan: ExecutablePlan<any>; pgCodec: PgTypeCodec };
    },
  ) {
    super();
    this.source = source;
    this.name = source.name;
    this.symbol = Symbol(this.name);
    this.alias = sql.identifier(this.symbol);
    this.contextId = this.addDependency(this.source.context());
    if (columns) {
      Object.entries(columns).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }

  set<TKey extends keyof TDataSource["columns"]>(
    name: TKey,
    value:
      | PgTypedExecutablePlan<TDataSource["columns"][TKey]["codec"]>
      | { plan: ExecutablePlan<any>; pgCodec: PgTypeCodec },
  ): void {
    if (this.locked) {
      throw new Error("Cannot set after plan is locked.");
    }
    if (isDev) {
      if (this.columns.some((col) => col.name === name)) {
        throw new Error(
          `Column '${name}' was specified more than once in ${this}`,
        );
      }
    }
    if (value instanceof ExecutablePlan) {
      const depId = this.addDependency(value);
      const pgCodec = value.pgCodec;
      if (!pgCodec) {
        throw new Error(
          `Expected a PgTypedExecutablePlan; perhaps you meant to pass '{plan: ${value}, pgCodec: ...}' to ${this}.set(...)`,
        );
      }
      this.columns.push({ name, depId, pgCodec });
    } else {
      const depId = this.addDependency(value.plan);
      const pgCodec = value.pgCodec;
      this.columns.push({ name, depId, pgCodec });
    }
  }

  /**
   * Returns a plan representing a named attribute (e.g. column) from the newly
   * inserted row.
   */
  get<TAttr extends keyof TDataSource["TRow"]>(
    attr: TAttr,
  ): PgClassExpressionPlan<
    TDataSource,
    TDataSource["columns"][TAttr]["codec"]
  > {
    const dataSourceColumn: PgSourceColumn =
      this.source.columns[attr as string];
    if (!dataSourceColumn) {
      throw new Error(
        `${this.source} does not define an attribute named '${attr}'`,
      );
    }

    if (dataSourceColumn?.via) {
      throw new Error(`Cannot select a 'via' column from PgInsertPlan`);
    }

    /*
     * Only cast to `::text` during select; we want to use it uncasted in
     * conditions/etc. The reasons we cast to ::text include:
     *
     * - to make return values consistent whether they're direct or in nested
     *   arrays
     * - to make sure that that various PostgreSQL clients we support do not
     *   mangle the data in unexpected ways - we take responsibility for
     *   decoding these string values.
     */

    const sqlExpr = pgClassExpression(this, dataSourceColumn.codec);
    const colPlan = dataSourceColumn.expression
      ? sqlExpr`${sql.parens(dataSourceColumn.expression(this.alias))}`
      : sqlExpr`${this.alias}.${sql.identifier(String(attr))}`;
    return colPlan;
  }

  public select(fragment: SQL): number {
    // NOTE: it's okay to add selections after the plan is "locked" - lock only
    // applies to which rows are being selected, not what is being queried
    // about the rows.

    // Optimisation: if we're already selecting this fragment, return the existing one.
    const index = this.selects.findIndex((frag) =>
      sql.isEquivalent(frag, fragment),
    );
    if (index >= 0) {
      return index;
    }

    return this.selects.push(fragment) - 1;
  }

  public selectRecord(): number {
    if (!this.selectRecordIndex) {
      this.selectRecordIndex = this.select(sql`to_json(${this.alias})`);
    }
    return this.selectRecordIndex;
  }

  /**
   * `execute` will always run as a root-level query. In future we'll implement a
   * `toSQL` method that allows embedding this plan within another SQL plan...
   * But that's a problem for later.
   *
   * This runs the query for every entry in the values, and then returns an
   * array of results where each entry in the results relates to the entry in
   * the incoming values.
   *
   * NOTE: we don't know what the values being fed in are, we must feed them to
   * the plans stored in this.identifiers to get actual values we can use.
   */
  async execute(
    values: CrystalValuesList<any[]>,
  ): Promise<CrystalResultsList<any>> {
    if (!this.finalizeResults) {
      throw new Error("Cannot execute PgSelectPlan before finalizing it.");
    }
    const { text, rawSqlValues, queryValueDetailsBySymbol } =
      this.finalizeResults;

    // We must execute each mutation on its own, but we can at least do so in
    // parallel. Note we return a list of promises, each may reject or resolve
    // without causing the others to reject.
    return values.map(async (value) => {
      const sqlValues = queryValueDetailsBySymbol.size
        ? rawSqlValues.map((v) => {
            if (typeof v === "symbol") {
              const details = queryValueDetailsBySymbol.get(v);
              if (!details) {
                throw new Error(`Saw unexpected symbol '${inspect(v)}'`);
              }
              return details.processor(value[details.depId]);
            } else {
              return v;
            }
          })
        : rawSqlValues;
      const { rows } = await this.source.executeMutation({
        context: value[this.contextId],
        text,
        values: sqlValues,
      });
      return rows[0] ?? {};
    });
  }

  public finalize(): void {
    if (!this.isFinalized) {
      this.locked = true;
      const sourceSource = this.source.source;
      if (!sql.isSQL(sourceSource)) {
        throw new Error(
          `Error in ${this}: can only insert into sources defined as SQL, however ${
            this.source
          } has ${inspect(this.source.source)}`,
        );
      }
      const table = sql`${sourceSource} as ${this.alias}`;

      const fragmentsWithAliases = this.selects.map(
        (frag, idx) => sql`${frag} as ${sql.identifier(String(idx))}`,
      );
      const returning =
        fragmentsWithAliases.length > 0
          ? sql` returning\n${sql.indent(
              sql.join(fragmentsWithAliases, ",\n"),
            )}`
          : sql.blank;

      /*
       * NOTE: Though we'd like to do bulk inserts, there's no way of us
       * reliably linking the data back up again given users might:
       *
       * - rely on auto-generated primary keys
       * - have triggers manipulating the data so we can't match it back up
       *
       * Currently it seems that the order returned from `insert into ...
       * select ... order by ... returning ...` is the same order as the
       * `order by` was, however this is not guaranteed in the documentation
       * and as such cannot be relied upon. Further the pgsql-hackers list
       * explicitly declined guaranteeing this behaviour:
       *
       * https://www.postgresql.org/message-id/CAKFQuwbgdJ_xNn0YHWGR0D%2Bv%2B3mHGVqJpG_Ejt96KHoJjs6DkA%40mail.gmail.com
       *
       * So we have to make do with single inserts, alas.
       */
      const columnsCount = this.columns.length;
      if (columnsCount > 0) {
        // This is our common path
        const sqlColumns: SQL[] = new Array(columnsCount);
        const valueSymbols: symbol[] = new Array(columnsCount);
        const valuePlaceholders: SQL[] = new Array(columnsCount);
        const queryValueDetailsBySymbol: QueryValueDetailsBySymbol = new Map();
        for (let i = 0; i < columnsCount; i++) {
          const { name, depId, pgCodec } = this.columns[i];
          sqlColumns[i] = sql.identifier(name as string);
          const symbol = Symbol(name as string);
          valueSymbols[i] = symbol;
          valuePlaceholders[i] = sql`${sql.value(
            // THIS IS A DELIBERATE HACK - we will be replacing this symbol with
            // a value before executing the query.
            symbol as any,
          )}::${pgCodec.sqlType}`;
          queryValueDetailsBySymbol.set(symbol, {
            depId,
            processor: pgCodec.toPg,
          });
        }
        const columns = sql.join(sqlColumns, ", ");
        const values = sql.join(valuePlaceholders, ", ");
        const query = sql`insert into ${table} (${columns}) values (${values})${returning}`;
        const { text, values: rawSqlValues } = sql.compile(query);

        this.finalizeResults = {
          text,
          rawSqlValues,
          queryValueDetailsBySymbol,
        };
      } else {
        // No columns to insert?! Odd... but okay.
        const query = sql`insert into ${table} default values${returning}`;
        const { text, values: rawSqlValues } = sql.compile(query);

        this.finalizeResults = {
          text,
          rawSqlValues,
          queryValueDetailsBySymbol: EMPTY_MAP,
        };
      }
    }

    super.finalize();
  }
}

export function pgInsert<TDataSource extends PgSource<any, any, any, any, any>>(
  source: TDataSource,
  columns?: {
    [key in keyof TDataSource["columns"]]?:
      | PgTypedExecutablePlan<TDataSource["columns"][key]["codec"]>
      | { plan: ExecutablePlan<any>; pgCodec: PgTypeCodec };
  },
): PgInsertPlan<TDataSource> {
  return new PgInsertPlan(source, columns);
}
