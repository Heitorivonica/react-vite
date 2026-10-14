import { useState } from 'react'
import { supabase } from './supabase'
import { isFinished } from './constants'
import { btnPrimary, card, field } from './ui'
import ClientModal from './ClientModal'
import ClientDetail from './ClientDetail'

export default function Clients({ user, clients, tasks, reload, onOpenTask, onNewTask, onChangeStatus }) {
  const [selectedId, setSelectedId] = useState(null)
  const [modal, setModal] = useState(null) // null | 'new' | cliente que está sendo editado
  const [search, setSearch] = useState('')

  // Devolve uma mensagem de erro (texto) ou null se deu certo
  async function saveClient(data) {
    if (modal === 'new') {
      const { data: created, error } = await supabase.from('clients').insert(data).select().single()
      if (error) return errorMessage(error)
      setSelectedId(created.id)
    } else {
      const { error } = await supabase.from('clients').update(data).eq('id', modal.id)
      if (error) return errorMessage(error)
    }
    setModal(null)
    await reload()
    return null
  }

  const selected = clients.find((c) => c.id === selectedId)
  const today = new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD, no fuso local
  const text = search.trim().toLowerCase()
  const shown = clients.filter(
    (c) =>
      !text ||
      c.name.toLowerCase().includes(text) ||
      (c.contact_name || '').toLowerCase().includes(text) ||
      (c.email || '').toLowerCase().includes(text),
  )

  return (
    <>
      {selected ? (
        <ClientDetail
          user={user}
          client={selected}
          tasks={tasks.filter((t) => t.client_id === selected.id)}
          onBack={() => setSelectedId(null)}
          onEdit={() => setModal(selected)}
          onDeleted={() => {
            setSelectedId(null)
            reload()
          }}
          onOpenTask={onOpenTask}
          onNewTask={() => onNewTask({ clientId: selected.id })}
          onChangeStatus={onChangeStatus}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold">Clientes</h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente"
                className={`${field} flex-1 sm:w-64`}
              />
              <button onClick={() => setModal('new')} className={`${btnPrimary} whitespace-nowrap`}>
                + Novo cliente
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className={`${card} p-10 text-center text-gray-400`}>
              {clients.length === 0
                ? 'Nenhum cliente cadastrado ainda. Clique em “+ Novo cliente” para começar.'
                : 'Nenhum cliente encontrado.'}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map((c) => {
                const own = tasks.filter((t) => t.client_id === c.id)
                const open = own.filter((t) => !isFinished(t.status)).length
                const late = own.filter((t) => t.due_date && t.due_date < today && !isFinished(t.status)).length
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`${card} p-4 text-left transition hover:border-brand hover:shadow-md hover:shadow-brand/20`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-lg font-bold text-brand">
                        {c.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{c.name}</div>
                        <div className="truncate text-xs text-gray-500">{c.contact_name || c.email || 'Sem contato'}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 text-xs">
                      <span className="rounded-full bg-brand-light px-2 py-0.5 font-semibold text-brand-dark">
                        {open} em aberto
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{own.length} no total</span>
                      {late > 0 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600">
                          {late} {late === 1 ? 'atrasado' : 'atrasados'}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {modal && (
        <ClientModal
          key={modal === 'new' ? 'new' : modal.id}
          client={modal === 'new' ? null : modal}
          onSave={saveClient}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function errorMessage(error) {
  return error.code === '23505' ? 'Já existe um cliente com esse nome.' : 'Não foi possível salvar. Tente de novo.'
}
