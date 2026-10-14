// Data no padrão brasileiro: 2030-01-31 -> 31/01/2030
export function formatDate(iso) {
  if (!iso) return '—'
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

// Data e hora no padrão brasileiro: 31/01/2030 14:05
export function formatDateTime(value) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

// "há 5 minutos", "há 2 dias", "há 3 meses"...
export function timeAgo(value) {
  if (!value) return '—'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  const plural = (n, one, many) => `há ${n} ${n === 1 ? one : many}`
  if (seconds < 60) return 'agora mesmo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return plural(minutes, 'minuto', 'minutos')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return plural(hours, 'hora', 'horas')
  const days = Math.floor(hours / 24)
  if (days < 30) return plural(days, 'dia', 'dias')
  const months = Math.floor(days / 30)
  if (months < 12) return plural(months, 'mês', 'meses')
  return plural(Math.floor(days / 365), 'ano', 'anos')
}
