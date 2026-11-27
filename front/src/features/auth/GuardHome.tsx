import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Brand } from '../../components/Brand'
import { Icon } from '../../components/Icon'
import { apiRequest } from '../../lib/api'
import type { Session } from '../../types/auth'

type AttendanceQr = { token: string; expiresAt: string; siteId: string; expiresInSeconds: number }

export function GuardHome({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [qrImage, setQrImage] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refreshQr = useCallback(async () => {
    setError('')
    try {
      const response = await apiRequest<{ data: AttendanceQr }>('/api/attendance/qr/current', session.accessToken)
      const image = await QRCode.toDataURL(response.data.token, {
        width: 280,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#102b25', light: '#ffffff' },
      })
      setQrImage(image)
      setExpiresAt(response.data.expiresAt)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el QR. Intenta actualizarlo.')
    } finally {
      setLoading(false)
    }
  }, [session.accessToken])

  useEffect(() => {
    void refreshQr()
    const interval = window.setInterval(() => void refreshQr(), 45_000)
    return () => window.clearInterval(interval)
  }, [refreshQr])

  return <main className="flex min-h-screen flex-col bg-[#f5f7f6] text-slate-900">
    <header className="flex h-18 items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
      <Brand />
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-800">{session.user.email}</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">Vigilante</p></div>
        <button onClick={onLogout} className="secondary-button text-xs"><Icon name="logout" size={16} />Cerrar sesión</button>
      </div>
    </header>
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
      <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_34px_rgba(15,23,42,.045)] sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon name="shield" size={27} /></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Acceso de vigilancia</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Código QR de la sede</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Mantén esta pantalla abierta para que cada contratista escanee el código desde su celular y registre su entrada o salida.</p>

        <div className="mx-auto mt-7 flex min-h-74 max-w-[320px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
          {qrImage ? <img src={qrImage} alt="Código QR temporal para registrar asistencia" className="h-66 w-66 rounded-xl bg-white p-2" /> : <p className="text-sm text-slate-500">{loading ? 'Generando código…' : 'El código no está disponible.'}</p>}
        </div>
        {expiresAt && <p className="mt-4 text-xs text-slate-500">El QR cambia automáticamente cada 45 segundos. Vigente hasta las {new Date(expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.</p>}
        {error && <div role="alert" className="mx-auto mt-4 max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-700">{error}</div>}
        <button className="primary-button mt-5" onClick={() => void refreshQr()} disabled={loading}><Icon name="calendar" size={17} />Actualizar código</button>
        <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-xl bg-emerald-50/70 p-4 text-left">
          <Icon name="shield" size={17} className="mt-0.5 shrink-0 text-emerald-700" />
          <p className="text-xs leading-5 text-slate-600">El contratista debe estar en la sede y permitir el acceso a la ubicación de su celular. El código vence rápidamente.</p>
        </div>
      </div>
    </section>
  </main>
}
