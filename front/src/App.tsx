import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

type UserRole = 'ADMIN' | 'CONTRACTOR'
type User = { id: string; email: string; role: UserRole; contractorId: string | null }
type Session = { accessToken: string; user: User }
type Schedule = {
  id: string
  contractorId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  validFrom: string
  validUntil: string | null
  isActive: boolean
}
type ScheduleResponse = { schedules: Schedule[]; total: number; page: number; limit: number }
type ApiError = Error & { status?: number }

const dayNames: Record<string, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miércoles', THURSDAY: 'Jueves',
  FRIDAY: 'Viernes', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
}
const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function readSession(): Session | null {
  try {
    const value = sessionStorage.getItem('indeportes-session')
    return value ? JSON.parse(value) as Session : null
  } catch {
    return null
  }
}

async function apiRequest<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const error = new Error(typeof payload.message === 'string' ? payload.message : 'No se pudo completar la solicitud.') as ApiError
    error.status = response.status
    throw error
  }
  return payload as T
}

function bogotaToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className, 'aria-hidden': true as const }
  const shapes: Record<string, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M16 3v4M8 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.3a4 4 0 0 1 0 7.5M20 20v-1.5a4 4 0 0 0-3-3.87" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3.5M12 3.5h5A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5h-5" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    eye: <><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></>,
    check: <><path d="m5 12.5 4.3 4.3L19.5 6.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  }
  return <svg {...common}>{shapes[name] ?? shapes.grid}</svg>
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <div className={`flex items-center gap-3 ${inverse ? 'text-white' : 'text-slate-900'}`}>
    <div className="brand-mark"><span /><span /><span /></div>
    <div className="leading-tight">
      <p className="text-[13px] font-extrabold tracking-[.17em]">INDEPORTES</p>
      <p className={`mt-1 text-[9px] font-semibold tracking-[.2em] ${inverse ? 'text-slate-400' : 'text-slate-500'}`}>QUINDÍO · JORNADA</p>
    </div>
  </div>
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
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
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3.5 py-2 text-xs font-medium text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]" /> Plataforma de gestión institucional
        </div>
        <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] tracking-[-.045em] xl:text-[58px]">Tu jornada, <span className="text-emerald-300">en orden.</span></h1>
        <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Una forma simple y segura de organizar horarios, registrar asistencia y acompañar el trabajo de cada contratista.</p>
        <div className="mt-12 grid max-w-lg grid-cols-3 gap-3">
          {[
            ['01', 'Horarios claros'], ['02', 'Asistencia segura'], ['03', 'Gestión central'],
          ].map(([number, label]) => <div key={number} className="rounded-xl border border-white/10 bg-white/[.045] p-4 backdrop-blur-sm">
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
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-14 lg:max-w-[390px]">
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

function ScheduleForm({ onClose, onSaved, token }: { onClose: () => void; onSaved: () => Promise<void>; token: string }) {
  const [form, setForm] = useState({ contractorId: '', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00', validFrom: bogotaToday(), validUntil: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRequest('/api/schedules', token, {
        method: 'POST',
        body: JSON.stringify({ ...form, contractorId: form.contractorId.trim(), validUntil: form.validUntil || null }),
      })
      await onSaved()
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el horario.')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="schedule-form-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-700">Programación</p><h2 id="schedule-form-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Nuevo horario</h2><p className="mt-1 text-sm text-slate-500">Asigna una jornada semanal al contratista.</p></div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">✕</button>
      </div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block"><span className="label">Código del contratista</span><input className="field" value={form.contractorId} onChange={(event) => update('contractorId', event.target.value)} placeholder="Ej. CTR-001" required /></label>
        <label className="block"><span className="label">Día de la semana</span><select className="field" value={form.dayOfWeek} onChange={(event) => update('dayOfWeek', event.target.value)}>{dayOrder.map((day) => <option value={day} key={day}>{dayNames[day]}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Hora de entrada</span><input className="field" type="time" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} required /></label>
          <label className="block"><span className="label">Hora de salida</span><input className="field" type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} required /></label>
          <label className="block"><span className="label">Vigente desde</span><input className="field" type="date" value={form.validFrom} onChange={(event) => update('validFrom', event.target.value)} required /></label>
          <label className="block"><span className="label">Vigente hasta <span className="font-normal text-slate-400">(opcional)</span></span><input className="field" type="date" value={form.validUntil} onChange={(event) => update('validUntil', event.target.value)} /></label>
        </div>
        {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Guardando…' : 'Guardar horario'}</button>
        </div>
      </form>
    </section>
  </div>
}

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const isAdmin = session.user.role === 'ADMIN'
  const [activeView, setActiveView] = useState<'overview' | 'schedules'>('overview')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        const result = await apiRequest<ScheduleResponse>('/api/schedules?limit=100', session.accessToken)
        setSchedules(result.schedules)
        setTotal(result.total)
      } else {
        const result = await apiRequest<{ data: Schedule[] }>('/api/schedules/me', session.accessToken)
        setSchedules(result.data)
        setTotal(result.data.length)
      }
    } catch (cause) {
      if ((cause as ApiError).status === 401) onLogout()
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los horarios.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, onLogout, session.accessToken])

  useEffect(() => { void loadSchedules() }, [loadSchedules])

  const activeCount = useMemo(() => schedules.filter((schedule) => schedule.isActive).length, [schedules])
  const dayCount = useMemo(() => new Set(schedules.filter((schedule) => schedule.isActive).map((schedule) => schedule.dayOfWeek)).size, [schedules])
  const title = isAdmin ? (activeView === 'schedules' ? 'Horarios' : 'Panel de control') : 'Mi jornada'
  const description = isAdmin ? 'Organiza y consulta la programación semanal de los contratistas.' : 'Consulta tus horarios asignados y planifica tu semana.'

  return <div className="min-h-screen bg-[#f5f7f6] text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[254px] flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
      <Brand />
      <div className="mt-10 px-3"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Espacio de trabajo</p></div>
      <nav className="mt-3 space-y-1">
        <button onClick={() => setActiveView('overview')} className={`nav-item ${activeView === 'overview' ? 'nav-active' : ''}`}><Icon name="grid" size={18} />Resumen</button>
        <button onClick={() => setActiveView('schedules')} className={`nav-item ${activeView === 'schedules' ? 'nav-active' : ''}`}><Icon name="calendar" size={18} />{isAdmin ? 'Horarios' : 'Mi horario'}{isAdmin && <span className="ml-auto rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{total}</span>}</button>
      </nav>
      <div className="mt-auto rounded-xl bg-[#f1f7f3] p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm"><Icon name="shield" size={18} /></div>
        <p className="mt-3 text-xs font-semibold text-slate-800">Acceso protegido</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Tu sesión está activa y tus datos se consultan de forma segura.</p>
      </div>
      <button onClick={onLogout} className="mt-4 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><Icon name="logout" size={18} />Cerrar sesión</button>
    </aside>

    <div className="lg:pl-[254px]">
      <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
        <div className="lg:hidden"><Brand /></div>
        <div className="hidden text-xs text-slate-400 lg:block">Gestión institucional <span className="mx-2 text-slate-300">/</span><span className="font-semibold text-slate-600">{title}</span></div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-800">{session.user.email}</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">{isAdmin ? 'Administrador' : `Contratista${session.user.contractorId ? ` · ${session.user.contractorId}` : ''}`}</p></div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f2eb] text-xs font-bold text-emerald-900">{session.user.email.slice(0, 1).toUpperCase()}</div>
          <button onClick={onLogout} className="ml-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 lg:hidden" aria-label="Cerrar sesión"><Icon name="logout" size={18} /></button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">{isAdmin ? 'Administración' : 'Espacio del contratista'}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-900 sm:text-[34px]">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p></div>
          {isAdmin && <button className="primary-button self-start sm:self-auto" onClick={() => setShowForm(true)}><Icon name="plus" size={18} />Nuevo horario</button>}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard icon="calendar" label={isAdmin ? 'Horarios registrados' : 'Mis horarios'} value={loading ? '—' : String(total)} detail={isAdmin ? 'En todos los contratistas' : 'Vigentes a la fecha'} accent="green" />
          <MetricCard icon="check" label="Horarios activos" value={loading ? '—' : String(activeCount)} detail="Programaciones habilitadas" accent="blue" />
          <MetricCard icon="clock" label="Días programados" value={loading ? '—' : String(dayCount)} detail="Días diferentes de la semana" accent="gold" />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_16px_rgba(15,23,42,.025)]">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div><h2 className="text-[15px] font-semibold text-slate-900">{isAdmin ? 'Programación semanal' : 'Tus próximos horarios'}</h2><p className="mt-1 text-xs text-slate-500">{isAdmin ? 'Horarios creados y su vigencia' : 'Horario semanal vigente asociado a tu cuenta'}</p></div>
            <button className="secondary-button text-xs" onClick={() => void loadSchedules()} disabled={loading}><span className={loading ? 'animate-spin' : ''}>↻</span> Actualizar</button>
          </div>
          {error ? <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : loading ? <div className="space-y-3 p-6"><div className="skeleton h-10" /><div className="skeleton h-10" /><div className="skeleton h-10" /></div> : schedules.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><Icon name="calendar" size={22} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">Aún no hay horarios</h3><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">{isAdmin ? 'Crea el primer horario para empezar a organizar las jornadas.' : 'Cuando el administrador te asigne un horario, aparecerá en esta sección.'}</p>{isAdmin && <button className="primary-button mt-5" onClick={() => setShowForm(true)}><Icon name="plus" size={17} />Crear horario</button>}</div> : <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead><tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[.11em] text-slate-400"><th className="px-6 py-3.5">Contratista</th><th className="px-5 py-3.5">Día</th><th className="px-5 py-3.5">Jornada</th><th className="px-5 py-3.5">Vigencia</th><th className="px-5 py-3.5">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{schedules.map((schedule) => <tr key={schedule.id} className="transition hover:bg-slate-50/70"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600">{schedule.contractorId.slice(-2)}</div><div><p className="text-sm font-semibold text-slate-800">{schedule.contractorId}</p><p className="mt-0.5 text-[10px] text-slate-400">ID de contratista</p></div></div></td><td className="px-5 py-4 text-sm font-medium text-slate-700">{dayNames[schedule.dayOfWeek] ?? schedule.dayOfWeek}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"><Icon name="clock" size={14} className="text-slate-400" />{schedule.startTime} — {schedule.endTime}</span></td><td className="px-5 py-4 text-xs text-slate-600"><span>{schedule.validFrom}</span><span className="mx-1.5 text-slate-300">→</span><span>{schedule.validUntil ?? 'Sin fecha de fin'}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${schedule.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${schedule.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />{schedule.isActive ? 'Activo' : 'Inactivo'}</span></td></tr>)}</tbody>
            </table>
          </div>}
          {!loading && schedules.length > 0 && <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-[11px] text-slate-400"><span>Mostrando {schedules.length} de {total} horario{schedules.length === 1 ? '' : 's'}</span><span>Zona horaria: Colombia</span></div>}
        </section>
        <footer className="mt-8 flex flex-col justify-between gap-1 text-[10px] text-slate-400 sm:flex-row"><span>Indeportes Quindío · Gestión de jornada</span><span>Los horarios se muestran según su vigencia.</span></footer>
      </main>
    </div>
    {showForm && <ScheduleForm token={session.accessToken} onClose={() => setShowForm(false)} onSaved={loadSchedules} />}
  </div>
}

function MetricCard({ icon, label, value, detail, accent }: { icon: string; label: string; value: string; detail: string; accent: string }) {
  const colors: Record<string, string> = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', gold: 'bg-amber-50 text-amber-700' }
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_16px_rgba(15,23,42,.025)] sm:p-6">
    <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-[32px] font-semibold leading-none tracking-[-.04em] text-slate-900">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}><Icon name={icon} size={19} /></span></div>
    <p className="mt-4 text-[11px] text-slate-400">{detail}</p>
  </article>
}

function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const logout = useCallback(() => {
    sessionStorage.removeItem('indeportes-session')
    setSession(null)
  }, [])

  return session ? <Dashboard session={session} onLogout={logout} /> : <Login onLogin={setSession} />
}

export default App
