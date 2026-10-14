import { useState } from 'react'
import { PRIORITY, TEAM, getStatus, isFinished } from './constants'
import { btnPrimary, card } from './ui'
import Select from './Select'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const MAX_CHIPS = 3 // tarefas mostradas dentro de cada dia (o resto vira "+N mais")

const pad = (n) => String(n).padStart(2, '0')
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Em aberto primeiro; depois por prioridade
function sortDay(list) {
  return [...list].sort(
    (a, b) =>
      Number(isFinished(a.status)) - Number(isFinished(b.status)) ||
      (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1),
  )
}

// Calendário do mês com as tarefas colocadas no dia do prazo
export default function CalendarView({ tasks, clients, onOpenTask, onNewTask }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => toIso(new Date()))
  const [clientFilter, setClientFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  const todayIso = toIso(new Date())
  const clientName = new Map(clients.map((c) => [c.id, c.name]))
  const activeClient = clients.some((c) => c.id === clientFilter) ? clientFilter : 'all'

  const passes = (t) =>
    (activeClient === 'all' || t.client_id === activeClient) &&
    (assigneeFilter === 'all' || (assigneeFilter === '__none' ? !t.assignee : t.assignee === assigneeFilter))

  const withDate = tasks.filter((t) => t.due_date && passes(t))
  const withoutDate = tasks.filter((t) => !t.due_date && !isFinished(t.status) && passes(t))

  const byDay = new Map()
  for (const t of withDate) {
    const day = t.due_date.slice(0, 10)
    byDay.set(day, [...(byDay.get(day) ?? []), t])
  }

  // Dias que aparecem na grade (começa no domingo da semana do dia 1)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const offset = cursor.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows = Math.ceil((offset + daysInMonth) / 7)
  const cells = Array.from({ length: rows * 7 }, (_, i) => new Date(year, month, 1 - offset + i))

  const monthKey = `${year}-${pad(month + 1)}`
  const inMonth = withDate.filter((t) => t.due_date.startsWith(monthKey))
  const lateInMonth = inMonth.filter((t) => t.due_date < todayIso && !isFinished(t.status)).length

  const monthTitle = capital(cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
  const [sy, sm, sd] = selected.split('-').map(Number)
  const selectedTitle = capital(
    new Date(sy, sm - 1, sd).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  )
  const selectedTasks = sortDay(byDay.get(selected) ?? [])

  function go(delta) {
    const next = new Date(year, month + delta, 1)
    const now = new Date()
    const isCurrent = next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth()
    setCursor(next)
    setSelected(isCurrent ? toIso(now) : toIso(next))
  }

  function goToday() {
    const now = new Date()
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(toIso(now))
  }

  const clientOptions = [{ value: 'all', label: 'Todos os clientes' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]
  const assigneeOptions = [
    { value: 'all', label: 'Todos os responsáveis' },
    { value: '__none', label: 'Sem responsável' },
    ...TEAM.map((name) => ({ value: name, label: name })),
  ]

  const arrow = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-light'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold min-w-48">{monthTitle}</h1>
          <button onClick={() => go(-1)} aria-label="Mês anterior" className={arrow}>
            ‹
          </button>
          <button onClick={() => go(1)} aria-label="Próximo mês" className={arrow}>
            ›
          </button>
          <button onClick={goToday} className={arrow}>
            Hoje
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-48">
            <Select
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              options={assigneeOptions}
              ariaLabel="Filtrar por responsável"
            />
          </div>
          <div className="w-48">
            <Select
              value={activeClient}
              onChange={setClientFilter}
              options={clientOptions}
              searchable
              ariaLabel="Filtrar por cliente"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>
          <strong className="text-gray-700">{inMonth.length}</strong> {inMonth.length === 1 ? 'tarefa' : 'tarefas'} neste mês
        </span>
        {lateInMonth > 0 && (
          <span className="font-semibold text-red-600">
            {lateInMonth} {lateInMonth === 1 ? 'atrasada' : 'atrasadas'}
          </span>
        )}
        <span>A cor mostra o status · contorno vermelho = atrasada</span>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="grid grid-cols-7 bg-brand-dark text-center text-xs font-semibold text-white">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date) => {
            const iso = toIso(date)
            const list = sortDay(byDay.get(iso) ?? [])
            const isCurrentMonth = date.getMonth() === month
            const isToday = iso === todayIso
            const isSelected = iso === selected
            return (
              <div
                key={iso}
                onClick={() => setSelected(iso)}
                className={`min-h-20 sm:min-h-28 cursor-pointer border-b border-r border-gray-100 p-1.5 transition ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isSelected ? 'ring-2 ring-inset ring-brand' : 'hover:bg-brand-light/40'}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected(iso)
                  }}
                  aria-label={`${date.getDate()} de ${date.toLocaleDateString('pt-BR', { month: 'long' })}, ${list.length} tarefas`}
                  className={`h-6 w-6 rounded-full text-xs font-semibold ${
                    isToday ? 'bg-brand-dark text-brand' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {date.getDate()}
                </button>

                <div className="mt-1 hidden space-y-0.5 sm:block">
                  {list.slice(0, MAX_CHIPS).map((t) => {
                    const st = getStatus(t.status)
                    const finished = st.group === 'done'
                    const late = t.due_date < todayIso && !finished
                    return (
                      <button
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenTask(t)
                        }}
                        title={`${t.title} · ${st.label}`}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-semibold ${st.cls} ${
                          late ? 'ring-1 ring-red-400' : ''
                        } ${finished ? 'line-through opacity-60' : ''}`}
                      >
                        {t.title}
                      </button>
                    )
                  })}
                  {list.length > MAX_CHIPS && (
                    <div className="px-1 text-[11px] font-semibold text-gray-500">+{list.length - MAX_CHIPS} mais</div>
                  )}
                </div>

                {list.length > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-brand-dark px-1.5 text-[10px] font-bold text-brand sm:hidden">
                    {list.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <section className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-semibold">{selectedTitle}</h2>
            <div className="text-xs text-gray-500">
              {selectedTasks.length === 0
                ? 'Nenhuma tarefa com prazo neste dia'
                : `${selectedTasks.length} ${selectedTasks.length === 1 ? 'tarefa' : 'tarefas'}`}
            </div>
          </div>
          <button onClick={() => onNewTask({ dueDate: selected })} className={`${btnPrimary} !py-1.5`}>
            + Nova tarefa neste dia
          </button>
        </div>
        {selectedTasks.length > 0 && (
          <ul>
            {selectedTasks.map((t) => {
              const st = getStatus(t.status)
              const priority = PRIORITY[t.priority] ?? PRIORITY.medium
              const late = t.due_date < todayIso && st.group !== 'done'
              return (
                <li key={t.id}>
                  <button
                    onClick={() => onOpenTask(t)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left border-t border-gray-100 first:border-t-0 hover:bg-brand-light/60"
                  >
                    <span title={`Prioridade ${priority.label.toLowerCase()}`} className={`h-2.5 w-2.5 shrink-0 rounded-full ${priority.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-medium ${st.group === 'done' ? 'line-through text-gray-400' : ''}`}>
                        {t.title}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {clientName.get(t.client_id) ?? 'Sem cliente'} · {t.assignee || 'Sem responsável'}
                        {late && <span className="font-semibold text-red-600"> · atrasada</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {withoutDate.length > 0 && (
        <p className="text-xs text-gray-500">
          {withoutDate.length} {withoutDate.length === 1 ? 'tarefa em aberto está' : 'tarefas em aberto estão'} sem prazo e não
          {withoutDate.length === 1 ? ' aparece' : ' aparecem'} no calendário.
        </p>
      )}
    </div>
  )
}
