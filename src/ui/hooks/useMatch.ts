import { useCallback, useEffect, useState } from 'react'
import type { Match } from '@/domain'
import { getMatchService } from '@/application'

export function useMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(Boolean(matchId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const found = await getMatchService().get(matchId)
        if (cancelled) return
        setMatch(found ?? null)
        setError(found ? null : '找不到该对局')
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [matchId])

  const reload = useCallback(async () => {
    if (!matchId) {
      setMatch(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const found = await getMatchService().get(matchId)
      setMatch(found ?? null)
      if (!found) setError('找不到该对局')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  const update = useCallback((next: Match) => {
    setMatch(next)
  }, [])

  return { match, loading, error, reload, update }
}
