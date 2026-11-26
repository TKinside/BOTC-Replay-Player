import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  persistTheme,
  readStoredTheme,
  type Theme,
} from '../lib/theme'

/** App-wide light/dark preference (localStorage + `data-theme` on <html>). */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    persistTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((cur) => {
      const next: Theme = cur === 'dark' ? 'light' : 'dark'
      persistTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
