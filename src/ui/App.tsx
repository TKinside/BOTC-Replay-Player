import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { MatchListPage } from './pages/MatchListPage'
import { MatchEditorPage } from './pages/MatchEditorPage'

/** Support GitHub Pages project sites via Vite `base`. */
const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || undefined

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MatchListPage />} />
          <Route path="matches/:matchId" element={<MatchEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
