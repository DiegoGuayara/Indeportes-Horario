import { useState, type FormEvent } from 'react'
import { Brand } from '../../components/Brand'
import { Icon } from '../../components/Icon'
import { apiRequest } from '../../lib/api'
import type { Session } from '../../types/auth'

export function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiRequest<{ data: Session }>('/api/auth/login', undefined, {
        method: 'POST', body: JSON.stringify({ email: email.trim(), password }),
      })
      sessionStorage.setItem('indeportes-session', JSON.stringify(result.data))
      onLogin(result.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page min-h-screen bg-white lg:grid lg:grid-cols-[1.03fr_.97fr]">
    <section className="login-story relative hidden min-h-screen overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col xl:px-20">
      <div className="absolute inset-0 story-grid opacity-50" />
      <div className="relative z-10"><Brand inverse /></div>
      <div className="relative z-10 my-auto max-w-xl pb-14 pt-20">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3.5 py-2 text-xs font-medium text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]" /> Plataforma de gestión institucional
        </div>
        <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] tracking-[-.045em] xl:text-[58px]">Tu jornada, <span className="text-emerald-300">en orden.</span></h1>
        <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Una forma simple y segura de organizar horarios, registrar asistencia y acompañar el trabajo de cada contratista.</p>
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-3">
          {[
            ['01', 'Horarios claros'], ['02', 'Asistencia segura'], ['03', 'Gestión central'],
          ].map(([number, label]) => <div key={number} className="rounded-xl border border-white/10 bg-white/4.5 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-bold tracking-[.12em] text-emerald-300">{number}</p><p className="mt-3 text-xs font-medium text-slate-100">{label}</p>
          </div>)}
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-slate-400">
        <span>Instituto Departamental de Deportes</span><span>Quindío · Colombia</span>
      </div>
      <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full border border-emerald-200/10" />
      <div className="absolute -bottom-12 -right-10 h-72 w-72 rounded-full border border-emerald-200/10" />
      <div className="absolute bottom-12 right-24 h-32 w-32 rounded-full bg-emerald-300/10 blur-3xl" />
    </section>

    <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-24">
      <div className="lg:hidden"><Brand /></div>
      <div className="mx-auto flex w-full max-w-105 flex-1 flex-col justify-center py-14 lg:max-w-97.5">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Bienvenida</p>
          <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-.04em] text-slate-900">Inicia sesión</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Ingresa con las credenciales de tu cuenta institucional.</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-slate-700">Correo electrónico</span>
            <input className="field" type="email" autoComplete="username" placeholder="nombre@indeportes.gov.co" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-slate-700">Contraseña</span>
            <span className="relative block">
              <input className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name="eye" size={19} /></button>
            </span>
          </label>
          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">{error}</div>}
          <button className="primary-button w-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Verificando acceso…</> : <>Entrar a la plataforma <Icon name="arrow" size={18} /></>}
          </button>
        </form>
        <div className="mt-7 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-emerald-700" />
          <p className="text-xs leading-5 text-slate-500">Acceso protegido para personal autorizado. Si necesitas ayuda con tu cuenta, contacta al administrador.</p>
        </div>
      </div>
      <footer className="pb-4 text-center text-[11px] text-slate-400">© {new Date().getFullYear()} Indeportes Quindío · Sistema de gestión de jornada</footer>
    </section>
  </main>
}

