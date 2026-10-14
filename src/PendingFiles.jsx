import { useEffect, useMemo, useRef, useState } from 'react'
import { card } from './ui'
import { extension, isImage, MAX_SIZE } from './files'
import { formatSize } from './utils'
import useFilePaste from './useFilePaste'

// Anexos de uma tarefa que ainda não foi salva: ficam na tela e sobem junto com "Criar tarefa"
export default function PendingFiles({ files, onChange }) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function add(picked) {
    const tooBig = picked.find((f) => f.size > MAX_SIZE)
    setError(tooBig ? `"${tooBig.name}" passa de 20 MB e não foi adicionado.` : '')
    const ok = picked.filter((f) => f.size <= MAX_SIZE)
    if (ok.length > 0) onChange([...files, ...ok])
  }

  useFilePaste(true, add)

  // Miniaturas das imagens escolhidas (liberadas da memória quando a lista muda)
  const previews = useMemo(() => files.map((f) => (isImage(f.name) ? URL.createObjectURL(f) : null)), [files])
  useEffect(
    () => () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url))
    },
    [previews],
  )

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <h2 className="font-semibold">Anexos</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{files.length}</span>
        <span className="ml-auto text-xs text-gray-500">Sobem junto quando você criar a tarefa</span>
      </div>

      <div className="p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
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
            add([...e.dataTransfer.files])
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
          <div className="text-sm font-semibold">Arraste, clique ou cole (Ctrl+V) para anexar</div>
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
            add(picked)
          }}
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {files.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex h-24 items-center justify-center bg-gray-50">
                  {previews[i] ? (
                    <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
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
                  <div className="text-[11px] text-gray-500">{formatSize(f.size)} · aguardando salvar</div>
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, index) => index !== i))}
                    className="mt-1 text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
