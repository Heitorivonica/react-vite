import { supabase } from './supabase'

export const BUCKET = 'client-files'
export const MAX_SIZE = 20 * 1024 * 1024 // 20 MB por arquivo

// PDF, PNG, XLSX... (para mostrar o tipo do arquivo)
export const extension = (name) => (name.includes('.') ? name.split('.').pop().slice(0, 4).toUpperCase() : 'ARQ')

export const isImage = (name) => /\.(png|jpe?g|gif|webp)$/i.test(name)

// Imagem colada da área de transferência vem chamada "image.png": damos um nome com data e hora
export function namePasted(file) {
  if (!/^image\.\w+$/i.test(file.name)) return file
  const stamp = new Date().toLocaleString('pt-BR').replace(/[/:]/g, '-').replace(', ', ' ')
  return new File([file], `Captura ${stamp}.${file.name.split('.').pop()}`, { type: file.type })
}

// Envia um arquivo para a pasta privada e registra na tabela (client_files ou task_files).
// Devolve { row } se deu certo ou { error } com a mensagem.
export async function uploadAttachment({ table, column, ownerId, prefix, file, user }) {
  if (file.size > MAX_SIZE) return { error: `"${file.name}" passa de 20 MB e não foi enviado.` }
  const safeName = file.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
  const path = `${prefix}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) {
    return { error: `Não foi possível enviar "${file.name}". Confira se o SQL foi executado no Supabase.` }
  }
  const { data, error: dbError } = await supabase
    .from(table)
    .insert({ [column]: ownerId, name: file.name, path, size: file.size, uploaded_by: user.email })
    .select()
    .single()
  if (dbError) {
    await supabase.storage.from(BUCKET).remove([path])
    return { error: `Não foi possível registrar "${file.name}". Confira se o SQL foi executado no Supabase.` }
  }
  return { row: data }
}
