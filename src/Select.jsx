import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Caixa de seleção própria (no lugar do <select> do navegador).
// options = [{ value, label, dot? }]
// variant 'field' = campo de formulário | 'bare' = só o botão (use triggerClass para dar a cor)
export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  searchable = false,
  variant = 'field',
  triggerClass = '',
  ariaLabel,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const listRef = useRef(null)
  const searchRef = useRef(null)

  const selected = options.find((o) => o.value === value)
  const shown =
    searchable && query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options

  function openList() {
    const r = btnRef.current.getBoundingClientRect()
    const below = window.innerHeight - r.bottom
    const up = below < 240 && r.top > below
    const room = (up ? r.top : below) - 16
    setPos({
      left: r.left,
      width: Math.max(r.width, 250),
      top: up ? null : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : null,
      maxHeight: Math.max(120, Math.min(300, room)),
    })
    setQuery('')
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  function close(refocus = false) {
    setOpen(false)
    if (refocus) btnRef.current?.focus()
  }

  function choose(option) {
    onChange(option.value)
    close(true)
  }

  // Fecha ao clicar fora, rolar a página ou redimensionar a janela
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false)
    }
    const onScroll = (e) => {
      if (!listRef.current?.contains(e.target)) setOpen(false)
    }
    const onResize = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  // Ao abrir, leva o foco para a lista (ou para a busca) para o teclado funcionar
  useEffect(() => {
    if (open) (searchRef.current ?? listRef.current)?.focus()
  }, [open])

  // Mantém a opção destacada visível ao navegar com as setas
  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function onListKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (shown[active]) choose(shown[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close(true)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const triggerStyle =
    variant === 'bare'
      ? `inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${triggerClass}`
      : `w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-left transition focus:outline-none ${
          open
            ? 'border-brand ring-4 ring-brand/20'
            : 'border-gray-300 hover:border-brand/60 focus:border-brand focus:ring-4 focus:ring-brand/20'
        }`

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            if (!open) openList()
          }
        }}
        className={triggerStyle}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${selected.dot}`} />}
          <span className={`truncate ${selected ? '' : 'text-gray-400 font-normal'}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            tabIndex={-1}
            role="listbox"
            onKeyDown={onListKey}
            style={{
              position: 'fixed',
              left: pos.left,
              width: pos.width,
              top: pos.top ?? undefined,
              bottom: pos.bottom ?? undefined,
            }}
            className="z-50 overflow-hidden rounded-xl border border-white/10 bg-brand-dark text-white shadow-2xl shadow-black/40 ring-1 ring-brand/30 outline-none"
          >
            {searchable && (
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder="Buscar..."
                className="w-full border-b border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
              />
            )}
            <ul className="overflow-y-auto py-1" style={{ maxHeight: pos.maxHeight }}>
              {shown.map((o, i) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={`mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    i === active ? 'bg-white/10' : ''
                  } ${o.value === value ? 'font-semibold text-brand' : 'text-white/90'}`}
                >
                  {o.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${o.dot}`} />}
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.value === value && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              ))}
              {shown.length === 0 && <li className="px-3 py-2 text-sm text-white/50">Nada encontrado</li>}
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}
