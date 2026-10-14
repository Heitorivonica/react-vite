import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { card } from './ui'
import { BUCKET, extension, isImage, uploadAttachment } from './files'
import { formatDateTime, formatSize } from './utils'
import useFilePaste from './useFilePaste'

// Anexos de um cliente ou de uma tarefa já salva: arraste, clique ou cole (Ctrl+V).
// table/column dizem onde guardar: 'client_files'/'client_id' ou 'task_files'/'task_id'.
export default function Attachments({ table, column, ownerId, prefix, user, sqlFile, listenPaste = false }) {
  const [files, setFiles] = useState([])
  const [urls, setUrls] = useState({}) // endereço temporário das miniaturas
  const [loadError, setLoadError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const triedRef = useRef(new Set())

  useEffect(() => {
    let ativo = true
    supabase
      .from(table)
      .select('*')
      .eq(column, ownerId)
      .order('created_at', { ascending: false })
      .then(({ data, error: loadFailed }) => {
        if (!ativo) return
        if (loadFailed) setLoadError(true)
        else setFiles(data || [])
      })
    return () => {
      ativo = false
    }
  }, [table, column, ownerId])

  // Busca o endereço das miniaturas das imagens (uma vez por arquivo)
  useEffect(() => {
    const missing = files.filter((f) => isImage(f.name) && !triedRef.current.has(f.path))
    if (missing.length === 0) return
    missing.forEach((f) => triedRef.current.add(f.path))
    let ativo = true
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        missing.map((f) => f.path),
        3600,
      )
      .then(({ data }) => {
        if (!ativo || !data) return
        setUrls((prev) => ({
          ...prev,
          ...Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])),
        }))
      })
    return () => {
      ativo = false
    }
  }, [files])

  async function upload(picked) {
    if (picked.length === 0) return
    setUploading(true)
    setError('')
    for (const file of picked) {
      const result = await uploadAttachment({ table, column, ownerId, prefix, file, user })
      if (result.error) setError(result.error)
      else setFiles((prev) => [result.row, ...prev])
    }
    setUploading(false)
  }

  useFilePaste(listenPaste, upload)

  async function download(file) {
    setError('')
    const { data, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, 60, { download: file.name })
    if (urlError || !data) {
      setError('Não foi possível abrir o arquivo.')
      return
    }
    const link = document.createElement('a')
    link.href = data.signedUrl
    link.download = file.name
    link.click()
  }

  async function remove(file) {
    if (!confirm(`Excluir o anexo "${file.name}"?`)) return
    setError('')
    await supabase.storage.from(BUCKET).remove([file.path])
    const { error: deleteError } = await supabase.from(table).delete().eq('id', file.id)
    if (deleteError) {
      setError('Não foi possível excluir o anexo.')
      return
    }
    setFiles((prev) => prev.filter((f) => f.id !== file.id))
  }

  function openPicker() {
    inputRef.current?.click()
  }

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <h2 className="font-semibold">Anexos</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{files.length}</span>
      </div>

      {loadError ? (
        <p className="px-5 py-4 text-sm text-amber-700">
          Para usar os anexos, rode o SQL do arquivo <code>{sqlFile}</code> no Supabase e atualize a página.
        </p>
      ) : (
        <div className="p-4">
          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openPicker()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              upload([...e.dataTransfer.files])
            }}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 ${
              dragging ? 'border-brand bg-brand-light' : 'border-gray-300 hover:border-brand hover:bg-brand-light/50'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-brand-dark"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
            </svg>
            <div className="text-sm font-semibold">
              {uploading ? 'Enviando...' : 'Arraste, clique ou cole (Ctrl+V) para anexar'}
            </div>
            <div className="text-xs text-gray-500">Contratos, imagens, planilhas, PDFs... até 20 MB cada</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = [...e.target.files]
              e.target.value = ''
              upload(picked)
            }}
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {files.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {files.map((f) => (
                <li key={f.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="flex h-24 items-center justify-center bg-gray-50">
                    {isImage(f.name) && urls[f.path] ? (
                      <img src={urls[f.path]} alt={f.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="rounded-lg bg-brand-dark/10 px-3 py-2 text-sm font-bold text-brand-dark">
                        {extension(f.name)}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="truncate text-xs font-semibold" title={f.name}>
                      {f.name}
                    </div>
                    <div className="truncate text-[11px] text-gray-500">
                      {formatSize(f.size)} · {formatDateTime(f.created_at)}
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px] font-semibold">
                      <button type="button" onClick={() => download(f)} className="text-brand-dark hover:underline">
                        Baixar
                      </button>
                      <button type="button" onClick={() => remove(f)} className="text-red-600 hover:underline">
                        Excluir
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
