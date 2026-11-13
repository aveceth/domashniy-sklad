-- Выполнить ОДИН раз в Supabase -> SQL Editor.
-- Таблица хранит одну резервную копию на пользователя.
create table if not exists public.pantry_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.pantry_backups enable row level security;
revoke all on public.pantry_backups from anon;
grant select,insert,update on public.pantry_backups to authenticated;
drop policy if exists "backup_read_own" on public.pantry_backups;
create policy "backup_read_own" on public.pantry_backups for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "backup_insert_own" on public.pantry_backups;
create policy "backup_insert_own" on public.pantry_backups for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "backup_update_own" on public.pantry_backups;
create policy "backup_update_own" on public.pantry_backups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
