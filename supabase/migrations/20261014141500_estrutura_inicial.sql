-- SQL COMPLETO do app. Pode rodar quantas vezes quiser: o que já existe é ignorado.
-- Supabase > SQL Editor > New query > cole tudo > Run

-- ============ 1) Clientes ============
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text default '',
  email text default '',
  phone text default '',
  notes text default '',
  created_at timestamptz default now()
);
create unique index if not exists clients_name_unique on clients (lower(name));

-- ============ 2) Campos novos nas tarefas ============
alter table tasks add column if not exists client text;
alter table tasks add column if not exists client_id uuid references clients(id) on delete restrict;
alter table tasks add column if not exists priority text not null default 'medium'
  check (priority in ('low', 'medium', 'high'));
alter table tasks add column if not exists labels text[] not null default '{}';
alter table tasks add column if not exists reporter_email text;
alter table tasks add column if not exists updated_at timestamptz default now();
alter table tasks add column if not exists ticket_number bigint generated always as identity;

-- ============ 3) Contatos e anexos ============
create table if not exists client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  role text default '',
  phone text default '',
  email text default '',
  created_at timestamptz default now()
);

create table if not exists client_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  path text not null,
  size bigint,
  uploaded_by text,
  created_at timestamptz default now()
);

create table if not exists task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  name text not null,
  path text not null,
  size bigint,
  uploaded_by text,
  created_at timestamptz default now()
);

-- ============ 4) Aproveitar clientes que já estavam digitados nas tarefas ============
insert into clients (name)
select distinct on (lower(trim(client))) trim(client)
from tasks
where client is not null and trim(client) <> ''
order by lower(trim(client)), trim(client)
on conflict do nothing;

update tasks t
set client_id = c.id
from clients c
where t.client_id is null and lower(trim(t.client)) = lower(c.name);

-- ============ 5) Lista nova de status ============
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'tasks'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table tasks drop constraint %I', c);
  end loop;
end $$;

update tasks set status = 'analysis' where status = 'doing';

alter table tasks add constraint tasks_status_check check (status in (
  'new_client', 'todo', 'waiting', 'analysis', 'bm_check', 'integration', 'onboarding',
  'support', 'delivered', 'post_sale', 'follow_up', 'done', 'canceled'
));

-- ============ 6) Segurança: só quem está logado acessa ============
alter table clients enable row level security;
alter table client_contacts enable row level security;
alter table client_files enable row level security;
alter table task_files enable row level security;

drop policy if exists "logados acessam clientes" on clients;
create policy "logados acessam clientes" on clients
  for all to authenticated using (true) with check (true);

drop policy if exists "logados acessam contatos" on client_contacts;
create policy "logados acessam contatos" on client_contacts
  for all to authenticated using (true) with check (true);

drop policy if exists "logados acessam anexos" on client_files;
create policy "logados acessam anexos" on client_files
  for all to authenticated using (true) with check (true);

drop policy if exists "logados acessam anexos de chamados" on task_files;
create policy "logados acessam anexos de chamados" on task_files
  for all to authenticated using (true) with check (true);

-- ============ 7) Pasta privada dos arquivos ============
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

drop policy if exists "logados leem arquivos" on storage.objects;
create policy "logados leem arquivos" on storage.objects
  for select to authenticated using (bucket_id = 'client-files');

drop policy if exists "logados enviam arquivos" on storage.objects;
create policy "logados enviam arquivos" on storage.objects
  for insert to authenticated with check (bucket_id = 'client-files');

drop policy if exists "logados apagam arquivos" on storage.objects;
create policy "logados apagam arquivos" on storage.objects
  for delete to authenticated using (bucket_id = 'client-files');
