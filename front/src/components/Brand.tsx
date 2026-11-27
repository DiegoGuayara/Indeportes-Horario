
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <div className={`flex items-center gap-3 ${inverse ? 'text-white' : 'text-slate-900'}`}>
    <div className="brand-mark"><span /><span /><span /></div>
    <div className="leading-tight">
      <p className="text-[13px] font-extrabold tracking-[.17em]">INDEPORTES</p>
      <p className={`mt-1 text-[9px] font-semibold tracking-[.2em] ${inverse ? 'text-slate-400' : 'text-slate-500'}`}>QUINDÍO · JORNADA</p>
    </div>
  </div>
}
