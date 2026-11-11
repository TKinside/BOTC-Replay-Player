import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/ui'
import '@/ui/styles/index.css'

// GitHub Pages: public/404.html stashes the deep link, then boots index.html.
const REDIRECT_KEY = 'botc:ghpages-redirect'
const stashed = sessionStorage.getItem(REDIRECT_KEY)
if (stashed) {
  sessionStorage.removeItem(REDIRECT_KEY)
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  let rest = stashed
  if (basePath && stashed.startsWith(basePath)) {
    rest = stashed.slice(basePath.length) || '/'
  }
  const target = `${basePath}${rest.startsWith('/') ? rest : `/${rest}`}`
  if (target !== `${location.pathname}${location.search}${location.hash}`) {
    history.replaceState(null, '', target)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
