import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Match } from '@/domain'
import { getMatchService } from '@/application'
import { FACTION_COLOR } from '../lib/factionColor'

export function MatchListPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
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

  async function createTb() {
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

  async function createFromJson() {
    setCreating(true)
    setError(null)
    try {
      const { match, parse } = await getMatchService().createFromScriptJson(
        importText,
      )
      if (!parse.ok || !match) {
        setError(parse.ok ? '创建失败' : parse.errors.join('\n'))
        setCreating(false)
        return
      }
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
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">对局列表</h2>
            <p className="text-sm text-[var(--ink-muted)]">
              保存在浏览器 IndexedDB，刷新不丢
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={creating}
              onClick={() => void createTb()}
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
            >
              新建 · 暗流涌动
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={() => setShowImport((v) => !v)}
              className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
            >
              导入 JSON 建局
            </button>
          </div>
        </div>

        {showImport && (
          <div className="mb-4 rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-3">
            <textarea
              className="mb-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 font-mono text-xs"
              rows={5}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="粘贴 townsquare Script JSON 数组…"
            />
            <button
              type="button"
              disabled={creating || !importText.trim()}
              onClick={() => void createFromJson()}
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
            >
              解析并创建
            </button>
          </div>
        )}

        {error && (
          <p className="mb-3 whitespace-pre-wrap text-sm text-red-300">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">加载中…</p>
        ) : matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-panel)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
            还没有对局。新建「暗流涌动」或导入 townsquare Script JSON。
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
        <Link to={`/matches/${match.id}`} className="min-w-0 flex-1">
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
                <span
                  key={`${match.id}-${role.id}-${role.name}`}
                  title={role.name}
                  className="size-5 rounded-full"
                  style={{ background: FACTION_COLOR[role.faction] }}
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
          className="shrink-0 text-xs text-red-300"
        >
          删除
        </button>
      </div>
    </li>
  )
}
