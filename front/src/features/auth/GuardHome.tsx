import { Brand } from '../../components/Brand'
import { Icon } from '../../components/Icon'
import type { Session } from '../../types/auth'

export function GuardHome({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return <main className="flex min-h-screen flex-col bg-[#f5f7f6] text-slate-900">
    <header className="flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
      <Brand />
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-slate-800">{session.user.email}</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">Vigilante</p></div>
        <button onClick={onLogout} className="secondary-button text-xs"><Icon name="logout" size={16} />Cerrar sesión</button>
      </div>
    </header>
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon name="shield" size={30} /></div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Acceso de vigilancia</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Modo QR en preparación</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">Tu cuenta de vigilante está activa. Cuando habilitemos el control QR, aquí podrás mostrar el código de la sede.</p>
    </section>
  </main>
}

