-- Rode UMA vez no Supabase (depois do clientes.sql e do contatos.sql):
-- SQL Editor > New query > cole tudo > Run

-- Novos campos nas tarefas (prioridade, categorias, relator, atualização e número do chamado)
alter table tasks add column if not exists priority text not null default 'medium'
  check (priority in ('low', 'medium', 'high'));
alter table tasks add column if not exists labels text[] not null default '{}';
alter table tasks add column if not exists reporter_email text;
alter table tasks add column if not exists updated_at timestamptz default now();
alter table tasks add column if not exists ticket_number bigint generated always as identity;

-- Anexos dos chamados (o arquivo fica na mesma pasta privada dos anexos de clientes)
create table if not exists task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  name text not null,
  path text not null,
  size bigint,
  uploaded_by text,
  created_at timestamptz default now()
);

alter table task_files enable row level security;

create policy "logados acessam anexos de chamados" on task_files
  for all to authenticated using (true) with check (true);
