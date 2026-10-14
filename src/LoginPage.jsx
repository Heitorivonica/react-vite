import { useState } from 'react'
import { supabase } from './supabase'
import logo from './assets/logo.png'
import LoginCover from './LoginCover'

// Traduz as mensagens de erro do Supabase (vêm em inglês)
function traduzErro(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('User already registered')) return 'Este e-mail já tem cadastro.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco.'
  return msg
}

const field =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  function changeMode(newMode) {
    setMode(newMode)
    setError('')
    setInfo('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    let result
    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else if (mode === 'signup') {
      result = await supabase.auth.signUp({ email, password })
    } else {
      result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
    }

    setLoading(false)
    if (result.error) {
      setError(traduzErro(result.error.message))
    } else if (mode === 'signup') {
      setInfo('Conta criada! Se pedir confirmação, verifique seu e-mail.')
    } else if (mode === 'forgot') {
      setInfo('Enviamos um link para redefinir sua senha. Confira seu e-mail.')
    }
  }

  const headings = {
    login: 'Bem-vindo de volta',
    signup: 'Crie sua conta',
    forgot: 'Redefinir senha',
  }
  const subtitles = {
    login: 'Entre com seu e-mail e senha para ver suas tarefas.',
    signup: 'Use seu e-mail e escolha uma senha.',
    forgot: 'Informe seu e-mail e enviaremos um link para criar uma nova senha.',
  }
  const buttonLabels = {
    login: loading ? 'Entrando...' : 'Entrar',
    signup: loading ? 'Criando...' : 'Criar conta',
    forgot: loading ? 'Enviando...' : 'Enviar link',
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <LoginCover />

      <div className="flex items-center justify-center bg-white p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <img src={logo} alt="Talkbi" className="h-10 mb-8" />
          <div>
            <h1 className="text-2xl font-bold">{headings[mode]}</h1>
            <p className="mt-1 text-sm text-gray-500">{subtitles[mode]}</p>
          </div>

          <label className="block text-sm font-medium">
            E-mail
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${field} mt-1 font-normal`}
            />
          </label>

          {mode !== 'forgot' && (
            <label className="block text-sm font-medium">
              Senha
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${field} pr-20 font-normal`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-sm text-gray-500 font-normal"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}

          <button
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-brand-dark rounded-lg py-2.5 font-semibold"
          >
            {buttonLabels[mode]}
          </button>

          <div className="flex justify-between text-sm font-medium">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => changeMode('signup')} className="hover:underline">
                  Criar conta
                </button>
                <button type="button" onClick={() => changeMode('forgot')} className="hover:underline">
                  Esqueci minha senha
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button type="button" onClick={() => changeMode('login')} className="hover:underline">
                Voltar para o login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
