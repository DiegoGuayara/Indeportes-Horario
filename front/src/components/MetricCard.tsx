import { Icon } from './Icon'

export function MetricCard({ icon, label, value, detail, accent }: { icon: string; label: string; value: string; detail: string; accent: string }) {
  const colors: Record<string, string> = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', gold: 'bg-amber-50 text-amber-700' }
  return <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_16px_rgba(15,23,42,.025)] sm:p-6">
    <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-[32px] font-semibold leading-none tracking-[-.04em] text-slate-900">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}><Icon name={icon} size={19} /></span></div>
    <p className="mt-4 text-[11px] text-slate-400">{detail}</p>
  </article>
}

