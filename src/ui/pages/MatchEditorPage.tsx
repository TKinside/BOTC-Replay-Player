import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Match } from '@/domain'
import { getMatchService } from '@/application'
import { useMatch } from '../hooks/useMatch'
import { SeatingCircle } from '../components/SeatingCircle'
import { ScriptJsonImport } from '../components/ScriptJsonImport'
import { AddPlayersPanel } from '../components/AddPlayersPanel'
import { PlayerEditor } from '../components/PlayerEditor'
import { EventLogPanel } from '../components/EventLogPanel'

type Tab = 'table' | 'log' | 'export'

export function MatchEditorPage() {
  const { matchId } = useParams()
  const { match, loading, error, update } = useMatch(matchId)
  const matchRef = useRef<Match | null>(null)

  const [tab, setTab] = useState<Tab>('table')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    matchRef.current = match
  }, [match])

  const selectedPlayer = useMemo(
    () => match?.players.find((p) => p.id === selectedPlayerId) ?? null,
    [match, selectedPlayerId],
  )

  if (loading) {
    return <p className="text-sm text-[var(--ink-muted)]">加载对局…</p>
  }

  if (error || !match) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-300">{error ?? '对局不存在'}</p>
        <Link to="/" className="text-sm text-[var(--accent-soft)]">
          ← 返回列表
        </Link>
      </div>
    )
  }

  const service = getMatchService()

  async function run(action: (current: Match) => Promise<Match>) {
    const current = matchRef.current
    if (!current) return
    setBusy(true)
    setStatus(null)
    try {
      const next = await action(current)
      matchRef.current = next
      update(next)
      return next
    } catch (e) {
      const message = e instanceof Error ? e.message : '操作失败'
      console.error('[MatchEditor]', message, e)
      setStatus(message)
    } finally {
      setBusy(false)
    }
  }

  async function exportImage() {
    const current = matchRef.current
    if (!current) return
    setBusy(true)
    setStatus(null)
    try {
      const blob = await service.exportLongImage(current)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${current.script.name}-${current.id}.png`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('长图已导出（昵称原样保留）')
    } catch (e) {
      const message = e instanceof Error ? e.message : '导出失败'
      console.error('[MatchEditor] export', message, e)
      setStatus(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-sm text-[var(--accent-soft)] underline-offset-2 hover:underline"
        >
          ← 返回列表
        </Link>
        <span className="truncate text-xs text-[var(--ink-muted)]">
          已自动保存 · {new Date(match.updatedAt).toLocaleTimeString()}
        </span>
      </div>

      <header>
        <h2 className="text-lg font-medium">{match.script.name}</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          {match.players.length} 人 · {match.events.length} 条事件 · 说书人视角
        </p>
      </header>

      <nav className="sticky top-0 z-20 -mx-1 flex gap-1 overflow-x-auto border-b border-[var(--line)] bg-[var(--bg-deep)]/95 px-1 pb-px backdrop-blur-sm">
        {(
          [
            ['table', '圆桌'],
            ['log', '日志'],
            ['export', '导出'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              setStatus(null)
            }}
            className={`min-h-11 shrink-0 px-3 py-2 text-sm touch-manipulation ${
              tab === id
                ? 'border-b-2 border-[var(--accent)] text-[var(--ink)]'
                : 'text-[var(--ink-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {status && (
        <p
          role="alert"
          className="text-sm text-[var(--accent-soft)] whitespace-pre-wrap"
        >
          {status}
        </p>
      )}

      {tab === 'table' && (
        <div className="flex flex-col gap-4">
          <ScriptJsonImport
            disabled={busy}
            onImportJson={async (text) => {
              const current = matchRef.current
              if (!current) return '对局未加载'
              const { match: next, parse } =
                await service.importScriptIntoMatch(current, text)
              if (!parse.ok) return parse.errors.join('\n')
              if (next) {
                matchRef.current = next
                update(next)
              }
              const warn =
                parse.warnings.length > 0
                  ? `\n警告：\n${parse.warnings.join('\n')}`
                  : ''
              return `已导入「${parse.snapshot.name}」（${parse.snapshot.roles.length} 角色）${warn}`
            }}
          >
            <SeatingCircle
              match={match}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={setSelectedPlayerId}
            />
          </ScriptJsonImport>

          <AddPlayersPanel
            busy={busy}
            onAddOne={(name) => {
              void run(async (current) => {
                const next = await service.addPlayer(current, name)
                setSelectedPlayerId(next.players.at(-1)?.id)
                return next
              })
            }}
            onAddBatch={(names) => {
              void run(async (current) => {
                const next = await service.addPlayers(current, names)
                setSelectedPlayerId(next.players.at(-1)?.id)
                setStatus(`已加入 ${names.length} 名玩家`)
                return next
              })
            }}
          />

          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-3">
            <PlayerEditor
              match={match}
              player={selectedPlayer}
              onRename={(playerId, name) =>
                void run((current) =>
                  service.updatePlayer(current, playerId, { name }),
                )
              }
              onAssignRole={(playerId, roleId) =>
                void run((current) =>
                  service.assignRole(current, playerId, roleId),
                )
              }
              onRemove={(playerId) =>
                void run(async (current) => {
                  const next = await service.removePlayer(current, playerId)
                  setSelectedPlayerId(undefined)
                  return next
                })
              }
            />
          </div>
        </div>
      )}

      {tab === 'log' && (
        <EventLogPanel
          match={match}
          onAdvancePhase={() =>
            void run((current) => service.advancePhase(current))
          }
          onRecordEvent={(input) =>
            void run((current) => service.recordEvent(current, input))
          }
        />
      )}

      {tab === 'export' && (
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-4">
          <h3 className="text-base font-medium">长图导出</h3>
          <p className="text-sm text-[var(--ink-muted)]">
            生成包含圆桌昵称与分阶段日志的长图。昵称明文保留，无打码选项。
          </p>
          <ul className="text-sm text-[var(--ink-muted)]">
            {match.players.map((p) => (
              <li key={p.id}>
                {p.seatIndex + 1}. {p.name}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportImage()}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            导出长图 PNG
          </button>
        </div>
      )}
    </div>
  )
}
