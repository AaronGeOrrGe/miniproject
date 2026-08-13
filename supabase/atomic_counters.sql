-- Run this once in the Supabase SQL Editor.
-- These functions make viewCount/downloadCount/helpfulCount updates atomic,
-- fixing lost-update race conditions from concurrent requests.

create or replace function increment_view_count(p_project_id uuid)
returns void
language sql
as $$
  update projects
  set "viewCount" = coalesce("viewCount", 0) + 1
  where "projectId" = p_project_id;
$$;

create or replace function increment_download_count(p_project_id uuid)
returns void
language sql
as $$
  update projects
  set "downloadCount" = coalesce("downloadCount", 0) + 1
  where "projectId" = p_project_id;
$$;

-- Atomically toggles a user's helpful vote and returns the resulting state.
-- The whole read+write happens inside a single UPDATE statement, which
-- Postgres executes under a row-level lock, so concurrent calls can't
-- overwrite each other's changes.
create or replace function toggle_helpful(p_project_id uuid, p_user_id uuid)
returns table("isHelpful" boolean, "helpfulCount" integer)
language plpgsql
as $$
begin
  return query
  update projects
  set
    "helpfulBy" = case
      when coalesce("helpfulBy", array[]::uuid[]) @> array[p_user_id]
        then array_remove("helpfulBy", p_user_id)
      else array_append(coalesce("helpfulBy", array[]::uuid[]), p_user_id)
    end,
    "helpfulCount" = case
      when coalesce("helpfulBy", array[]::uuid[]) @> array[p_user_id]
        then greatest(coalesce("helpfulCount", 0) - 1, 0)
      else coalesce("helpfulCount", 0) + 1
    end
  where "projectId" = p_project_id
  returning
    coalesce("helpfulBy", array[]::uuid[]) @> array[p_user_id],
    "helpfulCount";
end;
$$;
