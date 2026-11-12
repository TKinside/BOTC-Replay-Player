import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Match } from '@/domain'
import { getMatchService } from '@/application'
import { RoleIcon } from '../components/RoleIcon'

export function MatchListPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setMatches(await getMatchService().list())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await getMatchService().list()
        if (!cancelled) setMatches(list)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function createMatch() {
    setCreating(true)
    setError(null)
    try {
      const match = await getMatchService().createTroubleBrewing()
      navigate(`/matches/${match.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      setCreating(false)
    }
  }

  async function removeMatch(id: string) {
    if (!confirm('删除该对局？此操作不可撤销。')) return
    await getMatchService().delete(id)
    await reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-medium">对局列表</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            保存在浏览器 IndexedDB，刷新不丢。脚本 JSON 在进入对局后于「圆桌」角上导入。
          </p>
        </div>

        <button
          type="button"
          disabled={creating}
          onClick={() => void createMatch()}
          className="mb-5 min-h-12 w-full rounded-xl bg-[var(--bg-elevated)] px-4 py-3.5 text-base font-medium text-[var(--ink)] ring-1 ring-[var(--line)] touch-manipulation disabled:opacity-60"
        >
          {creating ? '创建中…' : '+ 创建记录'}
        </button>

        {error && (
          <p className="mb-3 whitespace-pre-wrap text-sm text-red-300">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">加载中…</p>
        ) : matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-panel)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
            还没有对局。点上方「+ 创建记录」开始，再在圆桌导入脚本 JSON。
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onDelete={() => void removeMatch(match.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="统计占位">
        <h2 className="mb-1 text-lg font-medium text-[var(--ink-muted)]">
          统计
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          占位入口 — 统计面板延后至 MVP 之后。
        </p>
      </section>
    </div>
  )
}

function MatchCard({
  match,
  onDelete,
}: {
  match: Match
  onDelete: () => void
}) {
  const roles = match.players
    .map((p) => match.script.roles.find((r) => r.id === p.roleId))
    .filter(Boolean)
    .slice(0, 8)

  return (
    <li className="rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-3">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/matches/${match.id}`} className="min-w-0 flex-1 touch-manipulation">
          <p className="truncate font-medium">
            {match.title || match.script.name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {match.script.name} · {match.players.length} 人 ·{' '}
            {match.events.length} 条事件
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {new Date(match.updatedAt).toLocaleString()}
            {match.outcome?.winner && match.outcome.winner !== 'unset'
              ? ` · 胜方 ${match.outcome.winner}`
              : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {roles.map((role) =>
              role ? (
                <RoleIcon
                  key={`${match.id}-${role.id}-${role.name}`}
                  role={role}
                  size={22}
                />
              ) : null,
            )}
            {roles.length === 0 && (
              <span className="text-xs text-[var(--ink-muted)]">尚未指派角色</span>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-10 shrink-0 px-2 text-xs text-red-300 touch-manipulation"
        >
          删除
        </button>
      </div>
    </li>
  )
}
