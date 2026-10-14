import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { btnOutline, btnPrimary, card, field, label } from './ui'

function ContactModal({ contact, onSave, onClose }) {
  const isNew = !contact
  const [name, setName] = useState(contact?.name ?? '')
  const [role, setRole] = useState(contact?.role ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Preencha o nome do contato.')
      return
    }
    setError('')
    setSaving(true)
    const message = await onSave({ name: name.trim(), role: role.trim(), phone: phone.trim(), email: email.trim() })
    setSaving(false)
    if (message) setError(message)
  }

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-10" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <h2 className="text-xl font-bold">{isNew ? 'Novo contato' : 'Editar contato'}</h2>

        <div>
          <label htmlFor="contact-name" className={label}>
            Nome *
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Ex.: Marcos Silva"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="contact-role" className={label}>
            Cargo ou função
          </label>
          <input
            id="contact-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Ex.: Financeiro, TI, Diretor"
            className={field}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="contact-phone" className={label}>
              Telefone
            </label>
            <input
              id="contact-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className={label}>
              E-mail
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@cliente.com"
              className={field}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
            Cancelar
          </button>
          <button disabled={saving} className={btnPrimary}>
            {saving ? 'Salvando...' : isNew ? 'Adicionar contato' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Lista de pessoas de contato do cliente
export default function ClientContacts({ clientId }) {
  const [contacts, setContacts] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [editing, setEditing] = useState(null) // null | 'new' | contato

  useEffect(() => {
    let ativo = true
    supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) setLoadError(true)
        else setContacts(data || [])
      })
    return () => {
      ativo = false
    }
  }, [clientId])

  // Devolve uma mensagem de erro (texto) ou null se deu certo
  async function save(data) {
    if (editing === 'new') {
      const { data: row, error } = await supabase
        .from('client_contacts')
        .insert({ ...data, client_id: clientId })
        .select()
        .single()
      if (error) return 'Não foi possível salvar. Tente de novo.'
      setContacts((prev) => [...prev, row])
    } else {
      const { error } = await supabase.from('client_contacts').update(data).eq('id', editing.id)
      if (error) return 'Não foi possível salvar. Tente de novo.'
      setContacts((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)))
    }
    setEditing(null)
    return null
  }

  async function remove(contact) {
    if (!confirm(`Excluir o contato "${contact.name}"?`)) return
    const { error } = await supabase.from('client_contacts').delete().eq('id', contact.id)
    if (error) {
      alert('Não foi possível excluir o contato.')
      return
    }
    setContacts((prev) => prev.filter((c) => c.id !== contact.id))
  }

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Contatos</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{contacts.length}</span>
        </div>
        <button onClick={() => setEditing('new')} disabled={loadError} className={`${btnOutline} !py-1.5`}>
          + Contato
        </button>
      </div>

      {loadError && (
        <p className="px-5 py-4 text-sm text-amber-700">
          Para usar os contatos, rode o SQL do arquivo <code>supabase/contatos.sql</code> no Supabase e atualize a página.
        </p>
      )}

      {!loadError && contacts.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          Nenhum contato ainda. Adicione quem fala com a gente nesse cliente.
        </div>
      )}

      <ul>
        {contacts.map((c) => {
          return (
            <li key={c.id} className="flex items-start gap-3 px-5 py-3 border-t border-gray-100 first:border-t-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-brand">
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {c.name} {c.role && <span className="font-normal text-gray-500">· {c.role}</span>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="text-brand-dark hover:underline">
                      {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-brand-dark hover:underline break-all">
                      {c.email}
                    </a>
                  )}
                  {!c.phone && !c.email && <span className="text-gray-400">Sem telefone nem e-mail</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => setEditing(c)} className="text-brand-dark hover:underline">
                  Editar
                </button>
                <button onClick={() => remove(c)} className="text-red-600 hover:underline">
                  Excluir
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {editing && (
        <ContactModal
          key={editing === 'new' ? 'new' : editing.id}
          contact={editing === 'new' ? null : editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
