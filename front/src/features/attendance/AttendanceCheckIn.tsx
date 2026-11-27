import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'
import { Icon } from '../../components/Icon'
import { apiRequest } from '../../lib/api'
import type { Session } from '../../types/auth'

type EventType = 'ENTRY' | 'EXIT'
type AttendanceEvent = { id: string; eventType: EventType; occurredAt: string; latitude: string | number | null; longitude: string | number | null }

const formatEventType = (type: EventType) => type === 'ENTRY' ? 'Entrada' : 'Salida'

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este navegador no permite consultar la ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? 'Permite el acceso a la ubicación para registrar asistencia.'
        : error.code === error.TIMEOUT
          ? 'No se pudo obtener la ubicación a tiempo. Intenta de nuevo en un lugar abierto.'
          : 'No se pudo obtener la ubicación del celular.'
      reject(new Error(message))
    }, { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 })
  })
}

export function AttendanceCheckIn({ session }: { session: Session }) {
  const [events, setEvents] = useState<AttendanceEvent[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const handledQrRef = useRef(false)
  const submittingRef = useRef(false)

  const loadEvents = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const result = await apiRequest<{ data: AttendanceEvent[] }>('/api/attendance/events/me', session.accessToken)
      setEvents(result.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu historial de asistencia.')
    } finally {
      setHistoryLoading(false)
    }
  }, [session.accessToken])

  useEffect(() => { void loadEvents() }, [loadEvents])

  const nextEventType: EventType = useMemo(
    () => events[0]?.eventType === 'ENTRY' ? 'EXIT' : 'ENTRY',
    [events],
  )

  const submitQr = useCallback(async (qrToken: string) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const position = await getCurrentPosition()
      const result = await apiRequest<{ data: AttendanceEvent; location: { distanceMeters: number; radiusMeters: number } }>(
        '/api/attendance/events',
        session.accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            eventType: nextEventType,
            qrToken,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        },
      )
      setEvents((current) => [result.data, ...current])
      setNotice(`${formatEventType(result.data.eventType)} registrada. Ubicación verificada a ${result.location.distanceMeters} m de la sede.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la asistencia.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [nextEventType, session.accessToken])

  useEffect(() => {
    if (!isScanning || !videoRef.current) return
    let effectActive = true
    handledQrRef.current = false
    void import('@zxing/browser').then(({ BrowserQRCodeReader }) => {
      if (!effectActive || !videoRef.current) return
      const reader = new BrowserQRCodeReader()
      return reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (result, _decodeError, controls) => {
          if (!result || handledQrRef.current) return
          handledQrRef.current = true
          controls.stop()
          controlsRef.current = null
          setIsScanning(false)
          void submitQr(result.getText())
        },
      )
    }).then((controls) => {
      if (!controls) return
      if (effectActive) controlsRef.current = controls
      else controls.stop()
    }).catch((cause: unknown) => {
      if (!effectActive) return
      setIsScanning(false)
      setError(cause instanceof Error && cause.name === 'NotAllowedError'
        ? 'Permite el acceso a la cámara para escanear el QR.'
        : 'No se pudo iniciar la cámara. Verifica los permisos del navegador e intenta de nuevo.')
    })
    return () => {
      effectActive = false
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [isScanning, submitQr])

  const startScanning = () => {
    setError('')
    setNotice('')
    setIsScanning(true)
  }

  return <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_16px_rgba(15,23,42,.025)]">
    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
      <div><h2 className="text-[15px] font-semibold text-slate-900">Registro de asistencia</h2><p className="mt-1 text-xs text-slate-500">Escanea el QR que muestra el vigilante desde su celular.</p></div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" />Próxima marcación: {formatEventType(nextEventType)}</span>
    </div>
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.8fr)]">
      <div>
        {isScanning ? <div className="overflow-hidden rounded-2xl bg-slate-950">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-white"><span>Apunta la cámara al QR del vigilante</span><button className="rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20" onClick={() => setIsScanning(false)}>Cancelar</button></div>
        </div> : <div className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon name="calendar" size={23} /></div>
          <p className="mt-3 text-sm font-semibold text-slate-800">Registra tu {nextEventType === 'ENTRY' ? 'entrada' : 'salida'}</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Necesitarás permitir la cámara y la ubicación. La marcación solo se acepta cerca de la sede.</p>
          <button className="primary-button mt-4" onClick={startScanning} disabled={historyLoading || submitting}>
            {submitting ? <><span className="spinner" /> Verificando…</> : <>Escanear código QR <Icon name="arrow" size={17} /></>}
          </button>
        </div>}
        {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700">{error}</div>}
        {notice && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800">{notice}</div>}
      </div>
      <div className="rounded-2xl border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">Últimas marcaciones</h3><p className="mt-1 text-xs text-slate-500">Historial asociado a tu cuenta</p></div><button onClick={() => void loadEvents()} className="secondary-button" disabled={historyLoading}>↻ Actualizar</button></div>
        {historyLoading ? <p className="py-10 text-center text-xs text-slate-400">Cargando historial…</p> : events.length === 0 ? <p className="py-10 text-center text-xs text-slate-400">Aún no tienes marcaciones.</p> : <ul className="mt-4 divide-y divide-slate-100">
          {events.slice(0, 5).map((event) => <li key={event.id} className="flex items-center justify-between gap-3 py-3 first:pt-1">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><span className={`h-2 w-2 rounded-full ${event.eventType === 'ENTRY' ? 'bg-emerald-500' : 'bg-sky-500'}`} />{formatEventType(event.eventType)}</span>
            <time className="text-right text-[11px] leading-5 text-slate-500">{new Date(event.occurredAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</time>
          </li>)}
        </ul>}
      </div>
    </div>
  </section>
}
