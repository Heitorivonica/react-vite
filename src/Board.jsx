import { useState } from 'react'
import { GROUPS, PRIORITY, STATUS, STATUS_OPTIONS, getStatus } from './constants'
import { btnPrimary, btnDanger, card, field } from './ui'
import { formatDate } from './utils'
import Select from './Select'

export default function Board({
  tasks,
  clients,
  tab,
  setTab,
  onNewTask,
  onOpenTask,
  onChangeStatus,
  onRemoveTask,
}) {
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const clientName = new Map(clients.map((c) => [c.id, c.name]))
  const today = new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD, no fuso local
  const text = search.trim().toLowerCase()

  const activeClient = clients.some((c) => c.id === clientFilter) ? clientFilter : 'all'
  const groupStatuses = Object.entries(STATUS).filter(([, s]) => s.group === tab)
  const activeStatus = groupStatuses.some(([id]) => id === statusFilter) ? statusFilter : 'all'

  const byClient = tasks.filter((t) => activeClient === 'all' || t.client_id === activeClient)
  const visible = byClient.filter((t) => {
    const st = getStatus(t.status)
    return (
      st.group === tab &&
      (activeStatus === 'all' || st.key === activeStatus) &&
      (!text ||
        t.title.toLowerCase().includes(text) ||
        (clientName.get(t.client_id) || '').toLowerCase().includes(text) ||
        (t.assignee || '').toLowerCase().includes(text))
    )
  })
  const count = (group) => byClient.filter((t) => getStatus(t.status).group === group).length

  const clientOptions = [{ value: 'all', label: 'Todos os clientes' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]
  const statusFilterOptions = [
    { value: 'all', label: 'Todos os status' },
    ...groupStatuses.map(([value, s]) => ({ value, label: s.label, dot: s.dot })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <button onClick={() => onNewTask()} className={btnPrimary}>
          + Nova tarefa
        </button>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-2 border-b border-gray-200">
        <div className="flex gap-1">
          {Object.entries(GROUPS).map(([id, g]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === id ? 'border-brand text-brand-dark' : 'border-transparent text-gray-500 hover:text-brand-dark'
              }`}
            >
              {g.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === id ? 'bg-brand-light' : 'bg-gray-100'}`}>
                {count(id)}
              </span>
            </button>
          ))}
        </div>
        <div className="mb-2 flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="w-44 shrink-0">
            <Select
              value={activeStatus}
              onChange={setStatusFilter}
              options={statusFilterOptions}
              ariaLabel="Filtrar por status"
            />
          </div>
          <div className="w-44 shrink-0">
            <Select
              value={activeClient}
              onChange={setClientFilter}
              options={clientOptions}
              searchable
              ariaLabel="Filtrar por cliente"
            />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarefa, cliente ou responsável"
            className={`${field} flex-1 min-w-48 lg:w-64 lg:flex-none`}
          />
        </div>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-brand-dark text-white text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Tarefa</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const st = getStatus(t.status)
              const finished = st.group === 'done'
              const late = t.due_date && t.due_date < today && !finished
              const name = clientName.get(t.client_id)
              const priority = PRIORITY[t.priority] ?? PRIORITY.medium
              return (
                <tr
                  key={t.id}
                  onClick={() => onOpenTask(t)}
                  className="border-t border-gray-100 hover:bg-brand-light/60 cursor-pointer"
                >
                  <td className="px-4 py-3 max-w-xs">
                    <div className={`font-medium ${finished ? 'line-through text-gray-400' : ''}`}>
                      {t.ticket_number && <span className="mr-1.5 text-xs font-normal text-gray-400">#{t.ticket_number}</span>}
                      {t.title}
                    </div>
                    {t.description && <div className="text-xs text-gray-500 truncate">{t.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {name ? (
                      <span className="inline-block rounded-md bg-brand-dark/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                        {name}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      variant="bare"
                      value={st.key}
                      onChange={(status) => onChangeStatus(t.id, status)}
                      options={STATUS_OPTIONS}
                      searchable
                      triggerClass={`max-w-[12rem] rounded-full px-3 py-1 ${st.cls}`}
                      ariaLabel="Mudar status"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${priority.cls}`}>
                      <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
                      {priority.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.assignee || '—'}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${late ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {formatDate(t.due_date)}
                    {late && ' (atrasada)'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onRemoveTask(t)}
                      aria-label={`Excluir ${t.title}`}
                      className={`${btnDanger} !px-2 !py-1 text-xs`}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Nenhuma tarefa em “{GROUPS[tab].label}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
