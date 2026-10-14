-- Rode UMA vez no Supabase: SQL Editor > New query > cole tudo > Run

-- 1) Clientes
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

-- 2) Anexos dos clientes (o arquivo em si fica no Storage, aqui fica o registro)
create table if not exists client_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  path text not null,
  size bigint,
  uploaded_by text,
  created_at timestamptz default now()
);

-- 3) Ligar as tarefas aos clientes
alter table tasks add column if not exists client text;
alter table tasks add column if not exists client_id uuid references clients(id) on delete restrict;

-- 4) Aproveitar os clientes que você já tinha digitado nas tarefas
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

-- 5) Segurança: só quem está logado acessa
alter table clients enable row level security;
alter table client_files enable row level security;

create policy "logados acessam clientes" on clients
  for all to authenticated using (true) with check (true);
create policy "logados acessam anexos" on client_files
  for all to authenticated using (true) with check (true);

-- 6) Pasta privada para os arquivos
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

create policy "logados leem arquivos" on storage.objects
  for select to authenticated using (bucket_id = 'client-files');
create policy "logados enviam arquivos" on storage.objects
  for insert to authenticated with check (bucket_id = 'client-files');
create policy "logados apagam arquivos" on storage.objects
  for delete to authenticated using (bucket_id = 'client-files');
