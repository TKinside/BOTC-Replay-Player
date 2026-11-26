import { useTheme } from '../hooks/useTheme'

/** Compact theme switch — intended for the home header / list top-right. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextLabel = theme === 'dark' ? '浅色' : '深色'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`切换为${nextLabel}主题`}
      title={`切换为${nextLabel}主题`}
      className="min-h-10 shrink-0 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--ink)] touch-manipulation hover:border-[var(--accent)]"
    >
      {nextLabel}
    </button>
  )
}
