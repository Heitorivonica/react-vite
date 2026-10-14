import { GROUPS, PRIORITY, STATUS_OPTIONS, getStatus } from './constants'
import { btnPrimary, card } from './ui'
import { formatDate } from './utils'
import Select from './Select'

// Chamados (tarefas) de um cliente, em colunas: A fazer | Em andamento | Concluídos
export default function ClientTickets({ tasks, onOpenTask, onNewTask, onChangeStatus }) {
  const today = new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD, no fuso local
  const isLate = (t) => t.due_date && t.due_date < today && getStatus(t.status).group !== 'done'
  const lateCount = tasks.filter(isLate).length

  // Em aberto: quem vence primeiro aparece primeiro. Concluídos: os mais novos primeiro.
  const columnTasks = (group) => {
    const list = tasks.filter((t) => getStatus(t.status).group === group)
    if (group === 'done') return list
    return [...list].sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31'))
  }

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Chamados</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tasks.length}</span>
          {lateCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
              {lateCount} {lateCount === 1 ? 'atrasado' : 'atrasados'}
            </span>
          )}
        </div>
        <button onClick={onNewTask} className={`${btnPrimary} !py-1.5`}>
          + Novo chamado
        </button>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        {Object.entries(GROUPS).map(([group, g]) => {
          const list = columnTasks(group)
          return (
            <div key={group} className="rounded-xl bg-gray-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
                <h3 className="text-sm font-semibold">{g.label}</h3>
                <span className="text-xs text-gray-400">{list.length}</span>
              </div>

              <div className="space-y-2 max-h-[26rem] overflow-y-auto">
                {list.map((t) => {
                  const st = getStatus(t.status)
                  const late = isLate(t)
                  const priority = PRIORITY[t.priority] ?? PRIORITY.medium
                  return (
                    <div
                      key={t.id}
                      onClick={() => onOpenTask(t)}
                      className={`cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition hover:border-brand hover:shadow-md ${
                        late ? 'border-red-200' : 'border-gray-200'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenTask(t)
                        }}
                        className={`text-left text-sm font-semibold ${group === 'done' ? 'line-through text-gray-400' : ''}`}
                      >
                        <span
                          title={`Prioridade ${priority.label.toLowerCase()}`}
                          className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${priority.dot}`}
                        />
                        {t.title}
                      </button>
                      {t.description && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{t.description}</p>}

                      <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>

                      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                        <span className="flex min-w-0 items-center gap-1.5 text-gray-600">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-brand">
                            {t.assignee ? t.assignee.slice(0, 1).toUpperCase() : '?'}
                          </span>
                          <span className="truncate">{t.assignee || 'Sem responsável'}</span>
                        </span>
                        <span className={`shrink-0 ${late ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                          {t.due_date ? formatDate(t.due_date) : 'Sem prazo'}
                          {late && ' • atrasado'}
                        </span>
                      </div>

                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <Select
                          variant="bare"
                          value=""
                          onChange={(value) => onChangeStatus(t.id, value)}
                          options={STATUS_OPTIONS.filter((o) => o.value !== st.key)}
                          placeholder="Mover para..."
                          searchable
                          triggerClass="rounded-full border border-gray-200 px-2.5 py-1 text-gray-600 hover:bg-gray-50"
                          ariaLabel={`Mover ${t.title} para outro status`}
                        />
                      </div>
                    </div>
                  )
                })}
                {list.length === 0 && <p className="py-6 text-center text-xs text-gray-400">Nada por aqui</p>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
