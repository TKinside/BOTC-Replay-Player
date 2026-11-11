import { useMemo, useState } from 'react'
import type { Match } from '@/domain'
import { EventTypeRegistry } from '@/registries'

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

  const eventsByPhase = useMemo(() => {
    return match.phases.map((phase) => ({
      phase,
      events: match.events.filter((e) => e.phaseId === phase.id),
    }))
  }, [match])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-medium">事件日志</h3>
          <p className="text-xs text-[var(--ink-muted)]">
            当前：{currentPhase?.label ?? '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdvancePhase}
          className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm"
        >
          下一阶段
        </button>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-3">
        <p className="mb-2 text-sm font-medium">记一条</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_TYPES.map((id) => {
            const def = EventTypeRegistry.get(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTypeId(id)}
                className={`rounded-md px-2 py-1 text-xs ${
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

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-[var(--ink-muted)]">
            行动者
            <select
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-sm text-[var(--ink)]"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            >
              <option value="">（无）</option>
              {match.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--ink-muted)]">
            目标
            <select
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-sm text-[var(--ink)]"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">（无）</option>
              {match.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-2 block text-xs text-[var(--ink-muted)]">
          自定义文本（可选）
          <textarea
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-sm text-[var(--ink)]"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="补充说明…"
          />
        </label>

        <button
          type="button"
          className="mt-2 w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
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
                      className="rounded-md bg-[var(--bg-elevated)] px-3 py-2 text-sm"
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
