-- Run once in Supabase SQL Editor before copying Sheets data.
-- JSONB preserves existing optional fields, array/object values and IDs exactly.
-- Separate collections match lib/schema.ts. Existing app authorization remains
-- in the Next.js server; no browser/anon/authenticated role may access these tables.
begin;
do $$
declare
  t text;
begin
  foreach t in array array[
    'km_users', 'km_programs', 'km_companies', 'km_engagements',
    'km_assessments', 'km_sessions', 'km_experiments', 'km_ai_jobs',
    'km_panel_runs', 'km_mentor_meetings', 'km_audit_log'
  ] loop
    execute format('create table if not exists public.%I (
      id text primary key check (length(id) > 0),
      seq bigint generated always as identity unique,
      data jsonb not null check (jsonb_typeof(data) = ''object'' and data ? ''id'' and jsonb_typeof(data->''id'') = ''string'' and data->>''id'' = id)
    )', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
    execute format('grant usage, select on sequence public.%I to service_role', t || '_seq_seq');
  end loop;
end $$;

-- Atomic top-level merge avoids overwriting unrelated concurrent field changes.
create or replace function public.km_patch_row(table_name text, row_id text, patch jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if table_name not in (
    'km_users', 'km_programs', 'km_companies', 'km_engagements',
    'km_assessments', 'km_sessions', 'km_experiments', 'km_ai_jobs',
    'km_panel_runs', 'km_mentor_meetings', 'km_audit_log'
  ) then raise exception 'Unknown table'; end if;
  if jsonb_typeof(patch) is distinct from 'object' then raise exception 'Patch must be an object'; end if;
  execute format('update public.%I set data = data || ($1 - ''id'') where id = $2 returning data', table_name)
    into result using patch, row_id;
  return result;
end $$;
revoke all on function public.km_patch_row(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.km_patch_row(text, text, jsonb) to service_role;
commit;
