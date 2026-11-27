import { useCallback, useEffect, useMemo, useState } from 'react'
import { Brand } from '../../components/Brand'
import { Icon } from '../../components/Icon'
import { MetricCard } from '../../components/MetricCard'
import { apiRequest, type ApiError } from '../../lib/api'
import type { Session } from '../../types/auth'
import type { Schedule, ScheduleResponse } from '../../types/schedule'
import { dayNames } from './scheduleConstants'
import { ScheduleForm } from './ScheduleForm'

export function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
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

