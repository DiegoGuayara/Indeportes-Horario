import { useState, type FormEvent } from 'react'
import { apiRequest } from '../../lib/api'
import { bogotaToday } from '../../lib/date'
import { dayNames, dayOrder } from './scheduleConstants'

export function ScheduleForm({ onClose, onSaved, token }: { onClose: () => void; onSaved: () => Promise<void>; token: string }) {
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

