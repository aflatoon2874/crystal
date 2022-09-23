import type { GrafastResultsList, GrafastValuesList } from "../interfaces.js";
import { ExecutableStep } from "../step.js";
import { arrayOfLength } from "../utils.js";

export class ErrorStep extends ExecutableStep {
  static $$export = {
    moduleName: "grafast",
    exportName: "ErrorStep",
  };
  isSyncAndSafe = false;
  promise: Promise<void>;
  constructor(error: Error) {
    super();
    this.promise = Promise.reject(error);
  }

  execute(values: GrafastValuesList<any>): GrafastResultsList<any> {
    return arrayOfLength(values[0].length, this.promise);
  }
}

export function error(error: Error): ErrorStep {
  return new ErrorStep(error);
}
