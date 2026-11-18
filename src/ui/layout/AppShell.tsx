import { Link, Outlet } from 'react-router-dom'

/** Desktop-first shell: wide content up to ~1280px; phones just get full width + padding. */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <header className="mb-5 border-b border-[var(--line)] pb-4">
        <Link to="/" className="block touch-manipulation">
          <p className="text-xs tracking-widest text-[var(--ink-muted)]">
            BOTC Replay Player
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
            《血染钟楼复盘器》
          </h1>
        </Link>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
