select
  __forums__."name"::text as "0",
  array(
    select array[
      __messages__."body"::text,
      __users__."username"::text,
      __users__."gravatar_url"::text,
      __messages__."id"::text
    ]::text[]
    from app_public.messages as __messages__
    left outer join app_public.users as __users__
    on (__messages__."author_id"::"uuid" = __users__."id")
    where
      (
        __messages__.archived_at is null
      ) and (
        __forums__."id"::"uuid" = __messages__."forum_id"
      )
    order by __messages__."id" desc
    limit 3
  ) as "1",
  array(
    select array[
      (count(*))::text
    ]::text[]
    from app_public.messages as __messages__
    where
      (
        __messages__.archived_at is null
      ) and (
        __forums__."id"::"uuid" = __messages__."forum_id"
      )
  ) as "2"
from app_public.forums as __forums__
where (
  true /* authorization checks */
)
order by __forums__."id" asc
limit 2