import { useEffect, useMemo, useState } from 'react'
import type { Match, Phase, Player } from '@/domain'
import { formatPhaseEnLabel, formatPhaseLabel } from '@/domain'
import { EventTypeRegistry } from '@/registries'
import {
  allPlayerNames,
  buildFieldStatsReport,
  evilCampNames,
  goodCampNames,
  minionNames,
  townsfolkNames,
} from '../lib/fieldStatsReport'
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

type RecordQuickId =
  | 'storyteller'
  | 'all-players'
  | 'townsfolk'
  | 'minions'
  | 'good'
  | 'evil'

const RECORD_QUICK: {
  id: RecordQuickId
  label: string
  tone: 'neutral' | 'good' | 'evil'
}[] = [
  { id: 'storyteller', label: '说书人', tone: 'neutral' },
  { id: 'all-players', label: '全体玩家', tone: 'neutral' },
  { id: 'townsfolk', label: '镇民们', tone: 'good' },
  { id: 'minions', label: '爪牙们', tone: 'evil' },
  { id: 'good', label: '善良阵营', tone: 'good' },
  { id: 'evil', label: '邪恶阵营', tone: 'evil' },
]

function toneClass(tone: 'neutral' | 'good' | 'evil'): string {
  if (tone === 'good') return 'text-[var(--good)]'
  if (tone === 'evil') return 'text-[var(--evil)]'
  return 'text-[var(--ink)]'
}

function appendSnippet(current: string, snippet: string): string {
  const trimmed = current.trim()
  if (!trimmed) return `${snippet}`
  if (/[。.!！？?、，,\s]$/.test(trimmed)) return `${trimmed}${snippet}`
  return `${trimmed}${snippet}`
}

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

function resolveQuickSnippet(match: Match, id: RecordQuickId): string {
  switch (id) {
    case 'storyteller':
      return '说书人'
    case 'all-players': {
      const names = allPlayerNames(match)
      return names.length > 0 ? `全体玩家（${names.join('、')}）` : '全体玩家'
    }
    case 'townsfolk': {
      const names = townsfolkNames(match)
      return names.length > 0 ? `镇民们（${names.join('、')}）` : '镇民们'
    }
    case 'minions': {
      const names = minionNames(match)
      return names.length > 0
        ? `爪牙们（${names.join('、')}）`
        : '爪牙们'
    }
    case 'good': {
      const names = goodCampNames(match)
      return names.length > 0 ? `善良阵营（${names.join('、')}）` : '善良阵营'
    }
    case 'evil': {
      const names = evilCampNames(match)
      return names.length > 0 ? `邪恶阵营（${names.join('、')}）` : '邪恶阵营'
    }
  }
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
  const [actorId, setActorId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [text, setText] = useState('')
  const [pickField, setPickField] = useState<'target' | 'actor'>('target')
  const [endWithPeriod, setEndWithPeriod] = useState(true)

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
    setActorId('')
    setTargetId('')
    setText('')
    setPickField('target')
    setEndWithPeriod(true)
  }

  function insertIntoDraft(snippet: string) {
    setText((prev) => appendSnippet(prev, snippet))
  }

  function submitComposer() {
    if (!composer) return
    const raw = text.trim()
    if (!raw) return
    const finalText =
      composer.mode === 'record' && endWithPeriod && !/[。.!！？?]$/.test(raw)
        ? `${raw}。`
        : raw
    onRecordEvent({
      phaseId: composer.phaseId,
      typeId: composer.mode === 'custom' ? 'custom' : 'announce',
      text: finalText,
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
          pickFieldLabel={
            composer?.mode === 'record'
              ? '插入昵称'
              : pickField === 'actor'
                ? '行动者'
                : '目标'
          }
          onSelectPlayer={(playerId) => {
            const player = match.players.find((p) => p.id === playerId)
            if (!composer) {
              const phaseId = lastPhaseId ?? match.phases[0]?.id
              if (!phaseId || !player) return
              setComposer({ phaseId, mode: 'record' })
              setActorId('')
              setTargetId('')
              setPickField('target')
              setEndWithPeriod(true)
              setText(player.name)
              return
            }
            if (composer.mode === 'record') {
              if (player) insertIntoDraft(player.name)
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

            {composer.mode === 'record' ? (
              <>
                <label className="block text-xs text-[var(--ink-muted)]">
                  记录内容
                  <textarea
                    className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
                    rows={3}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="待选择。"
                  />
                </label>
                <label className="mt-2 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <input
                    type="checkbox"
                    checked={endWithPeriod}
                    onChange={(e) => setEndWithPeriod(e.target.checked)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  句号结尾
                </label>

                <p className="mt-3 mb-2 text-xs text-[var(--ink-muted)]">
                  也可点选上方圆桌座位，把昵称插入正文
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {RECORD_QUICK.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        insertIntoDraft(resolveQuickSnippet(match, opt.id))
                      }
                      className={`min-h-11 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-2 py-2 text-sm touch-manipulation ${toneClass(opt.tone)}`}
                    >
                      {opt.label}
                      {opt.id === 'minions' && (
                        <span className="mt-0.5 block text-[10px] font-normal text-[var(--ink-muted)]">
                          小怪宝等行为
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => insertIntoDraft(buildFieldStatsReport(match))}
                  className="mt-2 min-h-11 w-full rounded-md border border-dashed border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink-muted)] touch-manipulation"
                >
                  插入场上信息统计报告
                </button>

                <button
                  type="button"
                  disabled={!text.trim()}
                  className="mt-4 min-h-11 w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white touch-manipulation disabled:opacity-50"
                  onClick={submitComposer}
                >
                  写入记录
                </button>
              </>
            ) : (
              <>
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
                  文本
                  <textarea
                    className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
                    rows={3}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="写下本阶段备注…"
                  />
                </label>

                <button
                  type="button"
                  disabled={!text.trim()}
                  className="mt-4 min-h-11 w-full rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white touch-manipulation disabled:opacity-50"
                  onClick={submitComposer}
                >
                  写入文本
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
