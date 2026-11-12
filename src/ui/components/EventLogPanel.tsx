import { useMemo, useState } from 'react'
import type { Match, Player } from '@/domain'
import { EventTypeRegistry } from '@/registries'
import { SeatingCircle } from './SeatingCircle'

interface EventLogPanelProps {
  match: Match
  onAdvancePhase: () => void
  onRecordEvent: (input: {
    typeId: string
    text?: string
    actorPlayerIds?: string[]
    targetPlayerIds?: string[]
  }) => void
}

const QUICK_TYPES = [
  'nomination',
  'execution',
  'death',
  'poison',
  'drunk',
  'revive',
  'custom',
] as const

function playerOptionLabel(match: Match, player: Player): string {
  const role = match.script.roles.find((r) => r.id === player.roleId)
  const seat = match.settings.showSeatNumbers
    ? `${player.seatIndex + 1}. `
    : ''
  return `${seat}${player.name} · ${role?.name ?? '未指派'}`
}

export function EventLogPanel({
  match,
  onAdvancePhase,
  onRecordEvent,
}: EventLogPanelProps) {
  const currentPhase = match.phases[match.phases.length - 1]
  const [typeId, setTypeId] = useState<string>('custom')
  const [actorId, setActorId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [text, setText] = useState('')
  const [pickField, setPickField] = useState<'target' | 'actor'>('target')

  const eventsByPhase = useMemo(() => {
    return match.phases.map((phase) => ({
      phase,
      events: match.events.filter((e) => e.phaseId === phase.id),
    }))
  }, [match])

  const selectedPlayerId = pickField === 'actor' ? actorId : targetId

  const sortedPlayers = useMemo(
    () =>
      match.players.slice().sort((a, b) => a.seatIndex - b.seatIndex),
    [match.players],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SeatingCircle
          match={match}
          compact
          selectedPlayerId={selectedPlayerId || undefined}
          onSelectPlayer={(playerId) => {
            if (pickField === 'actor') setActorId(playerId)
            else setTargetId(playerId)
          }}
        />
        <p className="text-center text-xs text-[var(--ink-muted)]">
          圆桌随事件实时更新 · 点选座位填入
          <button
            type="button"
            className={`mx-1 underline-offset-2 touch-manipulation ${
              pickField === 'target'
                ? 'text-[var(--accent-soft)] underline'
                : 'text-[var(--ink-muted)]'
            }`}
            onClick={() => setPickField('target')}
          >
            目标
          </button>
          或
          <button
            type="button"
            className={`mx-1 underline-offset-2 touch-manipulation ${
              pickField === 'actor'
                ? 'text-[var(--accent-soft)] underline'
                : 'text-[var(--ink-muted)]'
            }`}
            onClick={() => setPickField('actor')}
          >
            行动者
          </button>
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-medium">事件日志</h3>
          <p className="text-xs text-[var(--ink-muted)]">
            当前：{currentPhase?.label ?? '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdvancePhase}
          className="min-h-11 shrink-0 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm touch-manipulation"
        >
          下一阶段
        </button>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-3">
        <p className="mb-2 text-sm font-medium">记一条</p>
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {QUICK_TYPES.map((id) => {
            const def = EventTypeRegistry.get(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTypeId(id)}
                className={`min-h-10 shrink-0 rounded-md px-3 py-2 text-sm touch-manipulation ${
                  typeId === id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-elevated)] text-[var(--ink-muted)]'
                }`}
              >
                {def?.label ?? id}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-xs text-[var(--ink-muted)]">
            行动者
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
              value={actorId}
              onFocus={() => setPickField('actor')}
              onChange={(e) => {
                setActorId(e.target.value)
                setPickField('actor')
              }}
            >
              <option value="">（无）</option>
              {sortedPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerOptionLabel(match, p)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--ink-muted)]">
            目标
            <select
              className="mt-1 min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
              value={targetId}
              onFocus={() => setPickField('target')}
              onChange={(e) => {
                setTargetId(e.target.value)
                setPickField('target')
              }}
            >
              <option value="">（无）</option>
              {sortedPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerOptionLabel(match, p)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-2 block text-xs text-[var(--ink-muted)]">
          自定义文本（可选）
          <textarea
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="补充说明…"
          />
        </label>

        <button
          type="button"
          className="mt-3 min-h-11 w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white touch-manipulation"
          onClick={() => {
            onRecordEvent({
              typeId,
              text: text.trim() || undefined,
              actorPlayerIds: actorId ? [actorId] : undefined,
              targetPlayerIds: targetId ? [targetId] : undefined,
            })
            setText('')
          }}
        >
          写入日志
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {eventsByPhase.map(({ phase, events }) => {
          if (phase.kind === 'setup' && events.length === 0) return null
          return (
            <section key={phase.id}>
              <h4 className="mb-1 text-sm text-[var(--ink-muted)]">
                {phase.label}
              </h4>
              {events.length === 0 ? (
                <p className="text-xs text-[var(--ink-muted)]">（无事件）</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-md bg-[var(--bg-elevated)] px-3 py-2.5 text-sm leading-snug"
                    >
                      <span className="mr-2 text-xs text-[var(--accent-soft)]">
                        {EventTypeRegistry.get(event.typeId)?.label ??
                          event.typeId}
                      </span>
                      {event.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
