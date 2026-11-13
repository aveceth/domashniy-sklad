-- Выполните после исходного supabase.sql в SQL Editor.
create table if not exists public.push_subscriptions (
 endpoint text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 p256dh text not null,
 auth text not null,
 timezone text not null default 'UTC',
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
grant select,insert,update,delete on public.push_subscriptions to authenticated;
drop policy if exists push_subscriptions_owner on public.push_subscriptions;
create policy push_subscriptions_owner on public.push_subscriptions
for all to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create table if not exists public.push_delivery_log (
 endpoint text not null,
 local_day date not null,
 created_at timestamptz not null default now(),
 primary key (endpoint,local_day)
);
alter table public.push_delivery_log enable row level security;
revoke all on public.push_delivery_log from anon,authenticated;
-- Нет пользовательских правил для таблицы журнала: доступ только серверу через service role.
