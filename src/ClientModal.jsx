import { useState } from 'react'
import { btnPrimary, field, label } from './ui'

// client = null  -> cadastrando um cliente novo
// client = {...} -> editando um cliente que já existe
export default function ClientModal({ client, onSave, onClose }) {
  const isNew = !client
  const [name, setName] = useState(client?.name ?? '')
  const [contactName, setContactName] = useState(client?.contact_name ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Preencha o nome do cliente.')
      return
    }
    setError('')
    setSaving(true)
    const message = await onSave({
      name: name.trim(),
      contact_name: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    })
    setSaving(false)
    if (message) setError(message)
  }

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-10" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <h2 className="text-xl font-bold">{isNew ? 'Novo cliente' : 'Editar cliente'}</h2>

        <div>
          <label htmlFor="client-name" className={label}>
            Nome do cliente *
          </label>
          <input
            id="client-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Ex.: SuperPlac"
            className={field}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="client-contact" className={label}>
              Pessoa de contato
            </label>
            <input
              id="client-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nome de quem fala com a gente"
              className={field}
            />
          </div>
          <div>
            <label htmlFor="client-phone" className={label}>
              Telefone
            </label>
            <input
              id="client-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="client-email" className={label}>
            E-mail
          </label>
          <input
            id="client-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@cliente.com"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="client-notes" className={label}>
            Observações
          </label>
          <textarea
            id="client-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Informações importantes sobre o cliente"
            className={field}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-xl hover:bg-gray-100">
            Cancelar
          </button>
          <button disabled={saving} className={btnPrimary}>
            {saving ? 'Salvando...' : isNew ? 'Cadastrar cliente' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
