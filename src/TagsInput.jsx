import { useState } from 'react'
import { field } from './ui'

const MAX_TAGS = 8

// Categorias (etiquetas): digite e aperte Enter ou vírgula para adicionar
export default function TagsInput({ value, onChange }) {
  const [text, setText] = useState('')

  function add(raw) {
    const tag = raw.trim().slice(0, 24)
    setText('')
    if (!tag) return
    if (value.length >= MAX_TAGS || value.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-brand/60 bg-brand-light px-2 py-0.5 text-[11px] font-bold uppercase text-brand-dark"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                aria-label={`Remover categoria ${tag}`}
                className="text-brand-dark/60 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(text)
          } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => add(text)}
        placeholder={value.length >= MAX_TAGS ? 'Máximo de categorias atingido' : 'Digite e aperte Enter'}
        disabled={value.length >= MAX_TAGS}
        className={field}
      />
    </div>
  )
}
