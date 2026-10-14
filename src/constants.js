// Status das chamados/tarefas, na ordem do fluxo.
// group: em qual aba aparece (todo = A fazer | doing = Em andamento | done = Concluídos)
// Para incluir ou tirar um status: edite aqui E rode o SQL em supabase/status.sql
export const STATUS = {
    new_client: { label: 'Novo cliente', group: 'todo', cls: 'bg-sky-100 text-sky-800', dot: 'bg-sky-400' },
    todo: { label: 'A fazer', group: 'todo', cls: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
    waiting: { label: 'Aguardando', group: 'doing', cls: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
    analysis: { label: 'Em análise', group: 'doing', cls: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
    bm_check: { label: 'Verificação de BM', group: 'doing', cls: 'bg-violet-100 text-violet-800', dot: 'bg-violet-400' },
    integration: { label: 'Integração', group: 'doing', cls: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-400' },
    onboarding: {
        label: 'Implementação e treinamento',
        group: 'doing',
        cls: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-400',
    },
    support: { label: 'Em suporte', group: 'doing', cls: 'bg-rose-100 text-rose-800', dot: 'bg-rose-400' },
    delivered: { label: 'Entrega completa', group: 'done', cls: 'bg-lime-100 text-lime-800', dot: 'bg-lime-500' },
    post_sale: { label: 'Pós-venda', group: 'doing', cls: 'bg-teal-100 text-teal-800', dot: 'bg-teal-400' },
    follow_up: {
        label: 'Acompanhamento 30 dias',
        group: 'doing',
        cls: 'bg-cyan-100 text-cyan-800',
        dot: 'bg-cyan-400',
    },
    done: { label: 'Concluído', group: 'done', cls: 'bg-brand-light text-brand-dark', dot: 'bg-brand' },
    canceled: { label: 'Cancelado', group: 'done', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

// As três abas
export const GROUPS = {
    todo: { label: 'A fazer', dot: 'bg-gray-400' },
    doing: { label: 'Em andamento', dot: 'bg-amber-400' },
    done: { label: 'Concluídos', dot: 'bg-brand' },
}

// Status que uma tarefa nova recebe, conforme a aba aberta
export const GROUP_DEFAULT_STATUS = { todo: 'todo', doing: 'analysis', done: 'done' }

// Nome antigo -> nome novo (tarefas criadas antes da lista nova de status)
const LEGACY_STATUS = { doing: 'analysis' }

// Sempre devolve um status válido, mesmo para valores antigos ou desconhecidos
export function getStatus(status) {
    const key = STATUS[status] ? status : (LEGACY_STATUS[status] ?? 'todo')
    return { key, ...STATUS[key] }
}

// Concluído, entrega completa ou cancelado
export const isFinished = (status) => getStatus(status).group === 'done'

// Formato que a caixa de seleção entende
export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({
    value,
    label: s.label,
    dot: s.dot,
}))

// Prioridade do chamado
export const PRIORITY = {
    low: { label: 'Baixa', dot: 'bg-sky-400', cls: 'text-sky-700' },
    medium: { label: 'Média', dot: 'bg-amber-400', cls: 'text-amber-700' },
    high: { label: 'Alta', dot: 'bg-red-500', cls: 'text-red-600' },
}

export const PRIORITY_OPTIONS = Object.entries(PRIORITY).map(([value, p]) => ({
    value,
    label: p.label,
    dot: p.dot,
}))

// Pessoas que podem ser responsáveis por uma tarefa (para incluir alguém, é só adicionar uma linha)
export const TEAM = [
    'Gabriel Martin',
    'Heitor Ivonica',
    'Kaique Batista',
    'Henrique Sanches',
    'Glauber',
    'Leticia',
    'Iago',
    'Ryan',
]
