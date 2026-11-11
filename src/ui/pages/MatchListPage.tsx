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
        <div className="mb-3">
          <h2 className="text-lg font-medium">对局列表</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            保存在浏览器 IndexedDB，刷新不丢
          </p>
        </div>

        <div className="mb-4 grid gap-2">
          <button
            type="button"
            disabled={creating}
            onClick={() => void createTb()}
            className="min-h-11 rounded-md bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-white touch-manipulation disabled:opacity-60"
          >
            新建 · 官方脚本「暗流涌动」
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-dashed border-[var(--accent-soft)]/50 bg-[var(--bg-panel)] p-3">
          <h3 className="text-sm font-medium">导入 townsquare Script JSON 建局</h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            线上魔典导出的数组 JSON（含自制角色）。无 JSON 时用上方官方库建局即可。
          </p>
          <textarea
            className="mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 font-mono text-xs"
            rows={5}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"id":"_meta","name":"..."}, "washerwoman", ...]'
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={creating || !importText.trim()}
              onClick={() => void createFromJson()}
              className="min-h-11 rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white touch-manipulation disabled:opacity-60"
            >
              解析并创建
            </button>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-[var(--line)] px-3 py-2 text-sm touch-manipulation">
              选择文件
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setImportText(await file.text())
                }}
              />
            </label>
            <a
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--accent-soft)]"
              href={`${import.meta.env.BASE_URL}samples/custom-script.sample.json`}
              target="_blank"
              rel="noreferrer"
            >
              样例 JSON
            </a>
          </div>
        </div>

        {error && (
          <p className="mb-3 whitespace-pre-wrap text-sm text-red-300">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">加载中…</p>
        ) : matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-panel)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
            还没有对局。先新建「暗流涌动」，或粘贴 / 上传 Script JSON。
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
