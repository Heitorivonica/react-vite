import { supabase } from './supabase'
import { btnDanger, btnOutline, card } from './ui'
import { formatDate } from './utils'
import ClientTickets from './ClientTickets'
import ClientContacts from './ClientContacts'
import Attachments from './Attachments'

function Info({ title, children }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-0.5 text-sm break-words">{children || <span className="text-gray-400">—</span>}</div>
    </div>
  )
}

// Ficha completa do cliente: dados, chamados, contatos e anexos
export default function ClientDetail({
  user,
  client,
  tasks,
  onBack,
  onEdit,
  onDeleted,
  onOpenTask,
  onNewTask,
  onChangeStatus,
}) {
  async function deleteClient() {
    if (tasks.length > 0) {
      alert('Este cliente ainda tem chamados. Exclua os chamados ou troque o cliente deles antes de apagá-lo.')
      return
    }
    if (!confirm(`Excluir o cliente "${client.name}" e todos os anexos e contatos dele?`)) return
    const { data: files } = await supabase.from('client_files').select('path').eq('client_id', client.id)
    if (files && files.length > 0) {
      await supabase.storage.from('client-files').remove(files.map((f) => f.path))
    }
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) {
      alert('Não foi possível excluir o cliente. Tente de novo.')
      return
    }
    onDeleted()
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-brand-dark">
        ← Voltar para clientes
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark text-2xl font-bold text-brand">
            {client.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <div className="text-xs text-gray-500">Cliente desde {formatDate(client.created_at)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className={btnOutline}>
            Editar
          </button>
          <button onClick={deleteClient} className={btnDanger}>
            Excluir
          </button>
        </div>
      </div>

      <div className={`${card} p-5 grid gap-4 sm:grid-cols-3`}>
        <Info title="Contato principal">{client.contact_name}</Info>
        <Info title="Telefone">{client.phone}</Info>
        <Info title="E-mail">
          {client.email && (
            <a href={`mailto:${client.email}`} className="text-brand-dark underline">
              {client.email}
            </a>
          )}
        </Info>
        <div className="sm:col-span-3">
          <Info title="Observações">
            {client.notes && <span className="whitespace-pre-wrap">{client.notes}</span>}
          </Info>
        </div>
      </div>

      <ClientTickets tasks={tasks} onOpenTask={onOpenTask} onNewTask={onNewTask} onChangeStatus={onChangeStatus} />

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <ClientContacts clientId={client.id} />
        <Attachments
          table="client_files"
          column="client_id"
          ownerId={client.id}
          prefix={client.id}
          user={user}
          sqlFile="supabase/clientes.sql"
          listenPaste
        />
      </div>
    </div>
  )
}
