import { useRef, useState } from 'react'
import { field } from './ui'

// 2030-01-31 -> 31/01/2030
const toDisplay = (iso) => (iso ? iso.split('-').reverse().join('/') : '')

// 31/01/2030 -> 2030-01-31 (ou null se a data não existir)
function toIso(display) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display)
  if (!m) return null
  const [, day, month, year] = m
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const real =
    date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
  return real ? `${year}-${month}-${day}` : null
}

// Vai colocando as barras enquanto a pessoa digita: 31012030 -> 31/01/2030
function mask(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let out = digits.slice(0, 2)
  if (digits.length > 2) out += '/' + digits.slice(2, 4)
  if (digits.length > 4) out += '/' + digits.slice(4)
  return out
}

// Campo de data no padrão brasileiro (dia/mês/ano).
// onChange recebe (dataEmFormatoISO, valida): valida = false quando a data digitada está incompleta ou não existe.
export default function DateInput({ value, onChange }) {
  const [text, setText] = useState(toDisplay(value))
  const pickerRef = useRef(null)
  const invalid = text !== '' && toIso(text) === null

  function handleText(e) {
    const masked = mask(e.target.value)
    setText(masked)
    const iso = toIso(masked)
    onChange(iso ?? '', masked === '' || iso !== null)
  }

  function handlePicker(e) {
    setText(toDisplay(e.target.value))
    onChange(e.target.value, true)
  }

  function openPicker() {
    try {
      pickerRef.current?.showPicker()
    } catch {
      pickerRef.current?.focus()
    }
  }

  return (
    <div className="relative">
      <input
        value={text}
        onChange={handleText}
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        aria-invalid={invalid}
        className={`${field} pr-10 ${invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label="Abrir calendário"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-brand-dark"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={toIso(text) ?? ''}
        onChange={handlePicker}
        className="sr-only"
      />
    </div>
  )
}
