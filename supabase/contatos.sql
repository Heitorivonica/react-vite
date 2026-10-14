-- Rode UMA vez no Supabase (depois do clientes.sql): SQL Editor > New query > cole tudo > Run

create table if not exists client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  role text default '',
  phone text default '',
  email text default '',
  created_at timestamptz default now()
);

alter table client_contacts enable row level security;

create policy "logados acessam contatos" on client_contacts
  for all to authenticated using (true) with check (true);
