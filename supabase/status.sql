-- Rode UMA vez no Supabase: SQL Editor > New query > cole tudo > Run
-- Libera a lista nova de status (Novo cliente, Aguardando, Em análise, Integração...)

-- 1) Remove a regra antiga que só aceitava A fazer / Fazendo / Feito
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

-- 2) As tarefas que estavam em "Fazendo" passam para "Em análise"
update tasks set status = 'analysis' where status = 'doing';

-- 3) Regra nova com todos os status
alter table tasks add constraint tasks_status_check check (status in (
  'new_client', 'todo', 'waiting', 'analysis', 'bm_check', 'integration', 'onboarding',
  'support', 'delivered', 'post_sale', 'follow_up', 'done', 'canceled'
));
