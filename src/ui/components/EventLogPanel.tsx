import { useEffect, useMemo, useState } from 'react'
import type { Match, Phase, Player } from '@/domain'
import { formatPhaseEnLabel, formatPhaseLabel } from '@/domain'
import { EventTypeRegistry } from '@/registries'
import { SeatingStatusPanel } from './SeatingStatusPanel'

interface EventLogPanelProps {
  match: Match
  onAdvancePhase: () => void
  onRemovePhase: (phaseId: string) => void
  onRecordEvent: (input: {
    typeId: string
    text?: string
    phaseId: string
    actorPlayerIds?: string[]
    targetPlayerIds?: string[]
  }) => void
}

type ComposerMode = 'record' | 'custom'

const RECORD_TYPES = [
  'nomination',
  'execution',
  'death',
  'poison',
  'drunk',
  'revive',
] as const

function playerOptionLabel(match: Match, player: Player): string {
  const role = match.script.roles.find((r) => r.id === player.roleId)
  const seat = match.settings.showSeatNumbers
    ? `${player.seatIndex + 1}. `
    : ''
  return `${seat}${player.name} · ${role?.name ?? '未指派'}`
}

function PhaseIcon({ kind }: { kind: Phase['kind'] }) {
  if (kind === 'night') {
    return (
      <span aria-hidden className="text-lg leading-none text-[var(--ink-muted)]">
        ◐
      </span>
    )
  }
  if (kind === 'day') {
    return (
      <span aria-hidden className="text-lg leading-none text-[var(--ink-muted)]">
        ☀
      </span>
    )
  }
  return (
    <span aria-hidden className="text-lg leading-none text-[var(--ink-muted)]">
      ⇪
    </span>
  )
}

export function EventLogPanel({
  match,
  onAdvancePhase,
  onRemovePhase,
  onRecordEvent,
}: EventLogPanelProps) {
  const [composer, setComposer] = useState<{
    phaseId: string
    mode: ComposerMode
  } | null>(null)
  const [typeId, setTypeId] = useState<string>('nomination')
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

  const lastPhaseId = match.phases[match.phases.length - 1]?.id
  const canDeleteLast = match.phases.length > 1

  const activePhase = composer
    ? match.phases.find((p) => p.id === composer.phaseId)
    : undefined

  const selectedPlayerId = pickField === 'actor' ? actorId : targetId

  const sortedPlayers = useMemo(
    () => match.players.slice().sort((a, b) => a.seatIndex - b.seatIndex),
    [match.players],
  )

  useEffect(() => {
    if (!composer) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setComposer(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [composer])

  function openComposer(phaseId: string, mode: ComposerMode) {
    setComposer({ phaseId, mode })
    setTypeId(mode === 'custom' ? 'custom' : 'nomination')
    setActorId('')
    setTargetId('')
    setText('')
    setPickField('target')
  }

  function submitComposer() {
    if (!composer) return
    if (composer.mode === 'custom' && !text.trim()) return
    onRecordEvent({
      phaseId: composer.phaseId,
      typeId: composer.mode === 'custom' ? 'custom' : typeId,
      text: text.trim() || undefined,
      actorPlayerIds: actorId ? [actorId] : undefined,
      targetPlayerIds: targetId ? [targetId] : undefined,
    })
    setComposer(null)
    setText('')
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="mb-3">
        <SeatingStatusPanel
          match={match}
          selectedPlayerId={selectedPlayerId || undefined}
          pickFieldLabel={pickField === 'actor' ? '行动者' : '目标'}
          onSelectPlayer={(playerId) => {
            if (!composer) {
              const phaseId = lastPhaseId ?? match.phases[0]?.id
              if (!phaseId) return
              setComposer({ phaseId, mode: 'record' })
              setTypeId('nomination')
              setActorId('')
              setText('')
              setPickField('target')
              setTargetId(playerId)
              return
            }
            if (pickField === 'actor') setActorId(playerId)
            else setTargetId(playerId)
          }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--line)]">
        {eventsByPhase.map(({ phase, events }, index) => {
          const isLast = phase.id === lastPhaseId
          const zh = formatPhaseLabel(phase.kind, phase.index)
          const en = formatPhaseEnLabel(phase.kind, phase.index)
          const striped = index % 2 === 1

          return (
            <section
              key={phase.id}
              className={`border-b border-[var(--line)] px-3 py-4 last:border-b-0 ${
                striped ? 'bg-[var(--bg-elevated)]' : 'bg-[var(--bg-panel)]'
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <PhaseIcon kind={phase.kind} />
                <h3 className="text-lg font-medium leading-tight text-[var(--ink)]">
                  {zh}{' '}
                  <span className="text-sm font-normal text-[var(--ink-muted)]">
                    {en}
                  </span>
                </h3>
              </div>

              {events.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1.5">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-md bg-[var(--bg-deep)]/60 px-3 py-2.5 text-sm leading-snug"
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

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openComposer(phase.id, 'record')}
                  className="min-h-10 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] touch-manipulation"
                >
                  添加记录
                </button>
                <button
                  type="button"
                  onClick={() => openComposer(phase.id, 'custom')}
                  className="min-h-10 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] touch-manipulation"
                >
                  添加自定义文本
                </button>
                {isLast && canDeleteLast && (
                  <button
                    type="button"
                    onClick={() => onRemovePhase(phase.id)}
                    className="min-h-10 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-red-400 touch-manipulation"
                  >
                    删除本阶段
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onAdvancePhase}
        className="mt-4 min-h-12 w-full rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-base font-medium text-[var(--ink)] ring-1 ring-[var(--line)] touch-manipulation"
      >
        + 添加游戏阶段
      </button>

      {composer && activePhase && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-3 sm:items-center"
          role="presentation"
          onClick={() => setComposer(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phase-composer-title"
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg-panel)] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="phase-composer-title"
                  className="text-base font-medium text-[var(--ink)]"
                >
                  {composer.mode === 'custom' ? '添加自定义文本' : '添加记录'}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  {formatPhaseLabel(activePhase.kind, activePhase.index)} ·{' '}
                  {formatPhaseEnLabel(activePhase.kind, activePhase.index)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposer(null)}
                className="min-h-10 shrink-0 rounded-md px-2 text-sm text-[var(--ink-muted)] touch-manipulation"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>

            {composer.mode === 'record' && (
              <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {RECORD_TYPES.map((id) => {
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
            )}

            <p className="mb-2 text-xs text-[var(--ink-muted)]">
              点选上方圆桌座位可填
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
              /
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
              {composer.mode === 'custom' ? '文本' : '补充说明（可选）'}
              <textarea
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  composer.mode === 'custom' ? '写下本阶段备注…' : '补充说明…'
                }
              />
            </label>

            <button
              type="button"
              disabled={composer.mode === 'custom' && !text.trim()}
              className="mt-4 min-h-11 w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white touch-manipulation disabled:opacity-50"
              onClick={submitComposer}
            >
              {composer.mode === 'custom' ? '写入文本' : '写入记录'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
