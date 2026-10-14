import { useState } from 'react'
import { supabase } from './supabase'
import logo from './assets/logo.png'

export default function NewPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white w-full max-w-sm rounded-2xl shadow-lg border border-gray-100 p-8 space-y-4"
      >
        <img src={logo} alt="Talkbi" className="h-10 mx-auto" />
        <p className="text-sm text-gray-500 text-center">Escolha uma nova senha para sua conta.</p>
        <input
          type="password"
          required
          minLength={6}
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-brand-dark rounded-lg py-2.5 font-semibold"
        >
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </div>
  )
}
