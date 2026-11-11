import { Link, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-4">
      <header className="mb-6 border-b border-[var(--line)] pb-4">
        <Link to="/" className="block">
          <p className="text-xs tracking-widest text-[var(--ink-muted)]">
            BOTC Replay Player
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
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
