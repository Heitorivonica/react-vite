import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import LoginPage from './LoginPage'
import AppShell from './AppShell'
import NewPassword from './NewPassword'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (recovering) return <NewPassword onDone={() => setRecovering(false)} />
  return session ? <AppShell user={session.user} /> : <LoginPage />
}
