import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { GROUP_DEFAULT_STATUS, getStatus } from './constants'
import { uploadAttachment } from './files'
import Board from './Board'
import CalendarView from './CalendarView'
import Clients from './Clients'
import TaskModal from './TaskModal'
import logo from './assets/logo.png'

const fetchTasks = () => supabase.from('tasks').select('*').order('created_at', { ascending: false })
const fetchClients = () => supabase.from('clients').select('*').order('name')

export default function AppShell({ user }) {
  const [view, setView] = useState('tasks') // 'tasks' | 'calendar' | 'clients'
  const [tab, setTab] = useState('todo') // aba aberta em Tarefas: todo | doing | done
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [dbError, setDbError] = useState(false)
  const [taskModal, setTaskModal] = useState(null) // null | { task, defaultStatus, defaultClientId }

  useEffect(() => {
    let ativo = true
    Promise.all([fetchTasks(), fetchClients()]).then(([t, c]) => {
      if (!ativo) return
      setTasks(t.data || [])
      setClients(c.data || [])
      setDbError(Boolean(t.error || c.error))
    })
    return () => {
      ativo = false
    }
  }, [])

  async function reload() {
    const [t, c] = await Promise.all([fetchTasks(), fetchClients()])
    setTasks(t.data || [])
    setClients(c.data || [])
    setDbError(Boolean(t.error || c.error))
  }

  function openNewTask({ status, clientId, dueDate } = {}) {
    setTaskModal({
      task: null,
      defaultStatus: status ?? GROUP_DEFAULT_STATUS[tab],
      defaultClientId: clientId ?? '',
      defaultDueDate: dueDate ?? '',
    })
  }

  function openTask(task) {
    setTaskModal({ task })
  }

  // Devolve uma mensagem de erro (texto) ou null se deu certo
  // files = anexos escolhidos antes de a tarefa existir (só na tarefa nova)
  async function saveTask(data, files = []) {
    let error
    let created = null
    if (taskModal.task) {
      ;({ error } = await supabase
        .from('tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', taskModal.task.id))
    } else {
      ;({ data: created, error } = await supabase
        .from('tasks')
        .insert({ ...data, reporter_email: user.email })
        .select()
        .single())
    }
    if (error) {
      // PGRST204 = faltam colunas novas | 23514 = o status novo ainda não é aceito (falta rodar o SQL)
      if (error.code === 'PGRST204') return 'Falta rodar o SQL novo no Supabase (arquivo supabase/chamados.sql).'
      if (error.code === '23514') return 'Falta rodar o SQL dos status no Supabase (arquivo supabase/status.sql).'
      return 'Não foi possível salvar. Tente de novo.'
    }
    // Com a tarefa criada, sobe os anexos que a pessoa já tinha escolhido
    const failed = []
    if (created && files.length > 0) {
      for (const file of files) {
        const result = await uploadAttachment({
          table: 'task_files',
          column: 'task_id',
          ownerId: created.id,
          prefix: `tasks/${created.id}`,
          file,
          user,
        })
        if (result.error) failed.push(file.name)
      }
    }
    setTab(getStatus(data.status).group)
    setTaskModal(null)
    await reload()
    if (failed.length > 0) {
      alert(
        `A tarefa foi criada, mas estes arquivos não foram anexados: ${failed.join(', ')}.\n` +
          'Abra a tarefa e anexe de novo.',
      )
    }
    return null
  }

  async function removeTask(task) {
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return
    const { data: files } = await supabase.from('task_files').select('path').eq('task_id', task.id)
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) {
      alert('Não foi possível excluir. Tente de novo.')
      return
    }
    // Apaga também os arquivos anexados ao chamado
    if (files && files.length > 0) await supabase.storage.from('client-files').remove(files.map((f) => f.path))
    setTaskModal(null)
    await reload()
  }

  async function changeStatus(id, status) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      if (error.code === '23514') alert('Falta rodar o SQL dos status no Supabase (arquivo supabase/status.sql).')
      reload()
    }
  }

  const navButton = (id, text) => (
    <button
      onClick={() => setView(id)}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
        view === id ? 'bg-brand-dark text-white' : 'text-brand-dark hover:bg-brand-light'
      }`}
    >
      {text}
    </button>
  )

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-6">
          <img src={logo} alt="Talkbi" className="h-8" />
          <nav className="flex gap-1">
            {navButton('tasks', 'Tarefas')}
            {navButton('calendar', 'Calendário')}
            {navButton('clients', 'Clientes')}
          </nav>
        </div>
        <div className="text-sm flex items-center gap-3">
          <span className="hidden sm:inline text-gray-500">{user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="border border-brand-dark/20 rounded-lg px-3 py-1 hover:bg-brand-light"
          >
            Sair
          </button>
        </div>
      </header>

      {dbError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
          Não foi possível carregar tudo. Se você ainda não rodou o SQL de clientes no Supabase (arquivo{' '}
          <code>supabase/clientes.sql</code>), rode e atualize a página.
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4">
        {view === 'tasks' ? (
          <Board
            tasks={tasks}
            clients={clients}
            tab={tab}
            setTab={setTab}
            onNewTask={openNewTask}
            onOpenTask={openTask}
            onChangeStatus={changeStatus}
            onRemoveTask={removeTask}
          />
        ) : view === 'calendar' ? (
          <CalendarView tasks={tasks} clients={clients} onOpenTask={openTask} onNewTask={openNewTask} />
        ) : (
          <Clients
            user={user}
            clients={clients}
            tasks={tasks}
            reload={reload}
            onOpenTask={openTask}
            onNewTask={openNewTask}
            onChangeStatus={changeStatus}
          />
        )}
      </main>

      {taskModal && (
        <TaskModal
          key={taskModal.task ? taskModal.task.id : 'new'}
          task={taskModal.task}
          defaultStatus={taskModal.defaultStatus}
          defaultClientId={taskModal.defaultClientId}
          defaultDueDate={taskModal.defaultDueDate}
          clients={clients}
          user={user}
          onSave={saveTask}
          onDelete={() => removeTask(taskModal.task)}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  )
}
