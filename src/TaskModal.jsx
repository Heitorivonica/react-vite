import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { PRIORITY_OPTIONS, STATUS_OPTIONS, TEAM, getStatus } from './constants'
import { btnPrimary, field, label } from './ui'
import { formatDateTime, timeAgo } from './utils'
import Select from './Select'
import DateInput from './DateInput'
import TagsInput from './TagsInput'
import Attachments from './Attachments'
import PendingFiles from './PendingFiles'

// Uma linha do painel "Informações": nome do campo à esquerda, o campo à direita
function Row({ title, children, top = false }) {
  return (
    <div className={`grid grid-cols-[104px_1fr] gap-2 py-2.5 ${top ? 'items-start' : 'items-center'}`}>
      <div className={`text-xs font-medium text-gray-500 ${top ? 'pt-2' : ''}`}>{title}</div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// task = null  -> criando uma tarefa nova
// task = {...} -> editando uma tarefa que já existe
export default function TaskModal({
  task,
  defaultStatus = 'todo',
  defaultClientId = '',
  defaultDueDate = '',
  clients,
  user,
  onSave,
  onDelete,
  onClose,
}) {
  const isNew = !task
  const taskId = task?.id

  const [title, setTitle] = useState(task?.title ?? '')
  const [clientId, setClientId] = useState(task?.client_id ?? defaultClientId)
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState(task ? getStatus(task.status).key : defaultStatus)
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [assignee, setAssignee] = useState(task?.assignee ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? defaultDueDate)
  const [dateValid, setDateValid] = useState(true)
  const [labels, setLabels] = useState(task?.labels ?? [])
  const [pendingFiles, setPendingFiles] = useState([]) // anexos escolhidos antes de a tarefa existir
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (!taskId) return
    let ativo = true
    supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at')
      .then(({ data }) => {
        if (ativo) setComments(data || [])
      })
    return () => {
      ativo = false
    }
  }, [taskId])

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !clientId || !description.trim()) {
      setError('Preencha o nome, o cliente e a descrição da tarefa.')
      return
    }
    if (!dateValid) {
      setError('Data inválida. Use dia/mês/ano, por exemplo 25/12/2026.')
      return
    }
    setError('')
    setSaving(true)
    const message = await onSave(
      {
        title: title.trim(),
        client_id: clientId,
        description: description.trim(),
        status,
        priority,
        assignee,
        due_date: dueDate || null,
        labels,
      },
      pendingFiles,
    )
    setSaving(false)
    if (message) setError(message)
  }

  async function addComment() {
    if (!newComment.trim()) return
    const { data } = await supabase
      .from('comments')
      .insert({ task_id: taskId, body: newComment.trim(), author_email: user.email })
      .select()
      .single()
    if (data) setComments((prev) => [...prev, data])
    setNewComment('')
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))
  const assigneeOptions = [
    { value: '', label: 'Sem responsável' },
    // Tarefas antigas com um nome que não está na lista continuam aparecendo
    ...(task?.assignee && !TEAM.includes(task.assignee) ? [{ value: task.assignee, label: task.assignee }] : []),
    ...TEAM.map((name) => ({ value: name, label: name })),
  ]

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-10" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="rounded-md bg-brand-dark px-2 py-0.5 text-xs font-bold text-brand">
              {isNew ? 'NOVO' : task.ticket_number ? `#${task.ticket_number}` : 'TAREFA'}
            </span>
            <span className="font-semibold text-gray-700">{isNew ? 'Nova tarefa' : 'Editar tarefa'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg px-2 py-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2 min-w-0">
            <div>
              <label htmlFor="task-title" className={label}>
                Nome *
              </label>
              <input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                placeholder="Ex.: Integração com o sistema do cliente"
                className={`${field} !text-base font-semibold`}
              />
            </div>

            <div>
              <label htmlFor="task-desc" className={label}>
                Descrição *
              </label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={10}
                placeholder={'Informações do cliente, modo de conexão, o que vai ter, links...'}
                className={`${field} leading-relaxed`}
              />
            </div>

            {isNew ? (
              <>
                <PendingFiles files={pendingFiles} onChange={setPendingFiles} />
                <p className="text-xs text-gray-500">Os comentários ficam disponíveis depois de criar a tarefa.</p>
              </>
            ) : (
              <>
                <Attachments
                  table="task_files"
                  column="task_id"
                  ownerId={taskId}
                  prefix={`tasks/${taskId}`}
                  user={user}
                  sqlFile="supabase/chamados.sql"
                  listenPaste
                />

                <div>
                  <h3 className="font-semibold text-sm mb-2">Comentários</h3>
                  <ul className="space-y-2">
                    {comments.map((c) => (
                      <li key={c.id} className="bg-brand-light rounded-xl p-3 text-sm">
                        <div className="text-xs text-gray-500">
                          {c.author_email} · {formatDateTime(c.created_at)}
                        </div>
                        <div className="whitespace-pre-wrap">{c.body}</div>
                      </li>
                    ))}
                    {comments.length === 0 && <li className="text-sm text-gray-400">Nenhum comentário ainda.</li>}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addComment()
                        }
                      }}
                      placeholder="Escreva um comentário e aperte Enter..."
                      className={field}
                    />
                    <button type="button" onClick={addComment} className="text-sm bg-brand-dark text-white rounded-xl px-4">
                      Enviar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="self-start rounded-2xl border border-gray-200 px-4 py-2 divide-y divide-gray-100">
            <h3 className="py-2.5 text-sm font-semibold">Informações</h3>
            <Row title="Status">
              <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} searchable ariaLabel="Status" />
            </Row>
            <Row title="Responsável">
              <Select value={assignee} onChange={setAssignee} options={assigneeOptions} ariaLabel="Responsável" />
            </Row>
            <Row title="Prioridade">
              <Select value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} ariaLabel="Prioridade" />
            </Row>
            <Row title="Cliente *">
              <Select
                value={clientId}
                onChange={setClientId}
                options={clientOptions}
                placeholder="Selecione o cliente"
                searchable
                ariaLabel="Cliente"
              />
              {clients.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  Nenhum cliente cadastrado. Cadastre na aba <strong>Clientes</strong>.
                </p>
              )}
            </Row>
            <Row title="Data limite">
              <DateInput
                value={dueDate}
                onChange={(iso, valid) => {
                  setDueDate(iso)
                  setDateValid(valid)
                }}
              />
            </Row>
            <Row title="Categorias" top>
              <TagsInput value={labels} onChange={setLabels} />
            </Row>
            <Row title="Relator">
              <span className="text-sm break-all">{task?.reporter_email || (isNew ? user.email : '—')}</span>
            </Row>
            {!isNew && (
              <div className="py-2.5 text-xs text-gray-500 space-y-0.5">
                <div title={task.created_at ? formatDateTime(task.created_at) : ''}>Criado {timeAgo(task.created_at)}</div>
                {task.updated_at && (
                  <div title={formatDateTime(task.updated_at)}>Atualizado {timeAgo(task.updated_at)}</div>
                )}
              </div>
            )}
          </aside>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-3">
          {isNew ? (
            <span />
          ) : (
            <button type="button" onClick={onDelete} className="text-sm font-semibold text-red-600 hover:underline">
              Excluir tarefa
            </button>
          )}
          <div className="flex items-center gap-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
              Cancelar
            </button>
            <button disabled={saving} className={btnPrimary}>
              {saving ? 'Salvando...' : isNew ? 'Criar tarefa' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
