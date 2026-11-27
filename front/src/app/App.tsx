import { useCallback, useState } from 'react'
import { Login } from '../features/auth/Login'
import { GuardHome } from '../features/auth/GuardHome'
import { Dashboard } from '../features/schedules/Dashboard'
import { readSession } from '../lib/session'
import type { Session } from '../types/auth'

function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const logout = useCallback(() => {
    sessionStorage.removeItem('indeportes-session')
    setSession(null)
  }, [])

  if (!session) return <Login onLogin={setSession} />
  if (session.user.role === 'GUARD') return <GuardHome session={session} onLogout={logout} />
  return <Dashboard session={session} onLogout={logout} />
}

export default App
