import { useEffect, useMemo, useState } from 'react'
import type { Match, MoveEventDirection, Phase, Player } from '@/domain'
import {
  canMoveEvent,
  formatPhaseEnLabel,
  formatPhaseLabel,
} from '@/domain'
import {
  CustomTextActionRegistry,
  EventTypeRegistry,
} from '@/registries'
import {
  composeCustomTextLog,
  playerMentionToken,
} from '@/lib/customTextCompose'
import {
  allPlayerNames,
  buildFieldStatsReport,
  evilCampNames,
  goodCampNames,
  minionNames,
  townsfolkNames,
} from '../lib/fieldStatsReport'
import {
  isPlayerRecordActionId,
  PLAYER_RECORD_ACTIONS,
  PlayerActionIcon,
  type PlayerRecordAction,
  type PlayerRecordActionId,
} from '../lib/playerRecordActions'
import { EventLogText } from './EventLogText'
import { RoleMentionInput } from './RoleMentionInput'
import { SeatingStatusPanel } from './SeatingStatusPanel'

type PickField = 'actor' | 'target'

interface EventLogPanelProps {
  match: Match
  onAdvancePhase: () => void
  onRemovePhase: (phaseId: string) => void
  onRemoveEvent: (eventId: string) => void
  onMoveEvent: (eventId: string, direction: MoveEventDirection) => void
  onRecordEvent: (input: {
    typeId: string
    text?: string
    phaseId: string
    actorPlayerIds?: string[]
    targetPlayerIds?: string[]
    payload?: Record<string, unknown>
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

/** Second-level picks after tapping「说书人」(mini-program parity). */
const STORYTELLER_OPTIONS: { id: string; label: string }[] = [
  { id: 'three-out', label: '告知玩家：3个不在场角色' },
  { id: 'which-minions', label: '告知玩家：哪些玩家是爪牙' },
  { id: 'player-is-role', label: '告知玩家：某个玩家是某个角色' },
  { id: 'role-in-play', label: '告知玩家：某个角色在场' },
  { id: 'added-role', label: '加入了角色' },
  { id: 'pretend-role', label: '假装某个角色在场' },
  { id: 'pick-one', label: '选择1名玩家' },
  { id: 'custom', label: '自定义' },
]

type RecordPicker = 'root' | 'storyteller' | 'player'

function playerLogLabel(match: Match, player: Player): string {
  const role = match.script.roles.find((r) => r.id === player.roleId)
  return role?.name ? `${player.name}（${role.name}）` : player.name
}

function readLogIcons(payload: Record<string, unknown> | undefined): string[] {
  const raw = payload?.logIcons
  if (!Array.isArray(raw)) return []
  return raw.filter(isPlayerRecordActionId)
}

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

function resolveQuickSnippet(
  match: Match,
  id: Exclude<RecordQuickId, 'storyteller'>,
): string {
  switch (id) {
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

function ensureStorytellerPrefix(current: string): string {
  const trimmed = current.trim()
  if (!trimmed) return '说书人'
  if (trimmed.includes('说书人')) return trimmed
  return appendSnippet(trimmed, '说书人')
}

export function EventLogPanel({
  match,
  onAdvancePhase,
  onRemovePhase,
  onRemoveEvent,
  onMoveEvent,
  onRecordEvent,
}: EventLogPanelProps) {
  const [composer, setComposer] = useState<{
    phaseId: string
    mode: ComposerMode
  } | null>(null)
  const [actorId, setActorId] = useState('')
  const [actionId, setActionId] = useState('')
  /** Target player id slots; default one empty「（无）」slot when opening custom. */
  const [targetIds, setTargetIds] = useState<string[]>([''])
  const [targetSlotIndex, setTargetSlotIndex] = useState(0)
  const [text, setText] = useState('')
  const [pickField, setPickField] = useState<PickField>('actor')
  const [endWithPeriod, setEndWithPeriod] = useState(true)
  const [recordPicker, setRecordPicker] = useState<RecordPicker>('root')
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null)
  const [draftIcons, setDraftIcons] = useState<PlayerRecordActionId[]>([])

  const eventsByPhase = useMemo(() => {
    return match.phases.map((phase) => ({
      phase,
      events: match.events.filter((e) => e.phaseId === phase.id),
    }))
  }, [match])

  const moveFlags = useMemo(() => {
    const flags = new Map<string, { up: boolean; down: boolean }>()
    for (const event of match.events) {
      flags.set(event.id, {
        up: canMoveEvent(match, event.id, 'up'),
        down: canMoveEvent(match, event.id, 'down'),
      })
    }
    return flags
  }, [match])

  const lastPhaseId = match.phases[match.phases.length - 1]?.id
  const canDeleteLast = match.phases.length > 1

  const activePhase = composer
    ? match.phases.find((p) => p.id === composer.phaseId)
    : undefined

  const selectedTargetId =
    targetIds[targetSlotIndex] !== undefined
      ? targetIds[targetSlotIndex]
      : ''
  const selectedPlayerId =
    pickField === 'actor' ? actorId : selectedTargetId || undefined

  const sortedPlayers = useMemo(
    () => match.players.slice().sort((a, b) => a.seatIndex - b.seatIndex),
    [match.players],
  )

  const customTextActions = useMemo(
    () => CustomTextActionRegistry.list(),
    [],
  )

  const composedCustomPreview = useMemo(() => {
    if (composer?.mode !== 'custom') return ''
    const refOf = (id: string) => (id ? playerMentionToken(id) : '')
    return composeCustomTextLog({
      actorName: refOf(actorId),
      actionId,
      targetNames: targetIds.map(refOf),
      text,
    })
  }, [composer?.mode, actorId, actionId, targetIds, text])

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
    setActionId('')
    setTargetIds([''])
    setTargetSlotIndex(0)
    setText('')
    setPickField(mode === 'custom' ? 'actor' : 'target')
    setEndWithPeriod(true)
    setRecordPicker('root')
    setPendingPlayerId(null)
    setDraftIcons([])
  }

  function setTargetAt(index: number, playerId: string) {
    setTargetIds((prev) => {
      const next = prev.slice()
      if (index < 0 || index >= next.length) return prev
      next[index] = playerId
      return next
    })
    setTargetSlotIndex(index)
    setPickField('target')
  }

  function addTargetSlot() {
    setTargetIds((prev) => {
      const next = [...prev, '']
      setTargetSlotIndex(next.length - 1)
      return next
    })
    setPickField('target')
  }

  function removeTargetSlot(index: number) {
    setTargetIds((prev) => {
      if (prev.length === 0) return prev
      const next = prev.filter((_, i) => i !== index)
      setTargetSlotIndex((cur) => {
        if (next.length === 0) return 0
        if (cur > index) return Math.min(cur - 1, next.length - 1)
        if (cur >= next.length) return next.length - 1
        return cur
      })
      return next
    })
  }

  function insertIntoDraft(snippet: string) {
    setText((prev) => appendSnippet(prev, snippet))
  }

  function openStorytellerPicker() {
    setText((prev) => ensureStorytellerPrefix(prev))
    setPendingPlayerId(null)
    setRecordPicker('storyteller')
  }

  function openPlayerActionPicker(player: Player) {
    setPendingPlayerId(player.id)
    setTargetIds([player.id])
    setTargetSlotIndex(0)
    setRecordPicker('player')
  }

  function pickStorytellerOption(opt: (typeof STORYTELLER_OPTIONS)[number]) {
    if (opt.id === 'custom') {
      setText((prev) => ensureStorytellerPrefix(prev))
      setRecordPicker('root')
      return
    }
    setText((prev) => {
      const withSt = ensureStorytellerPrefix(prev)
      // Prefer「说书人」+ option as one phrase when draft is only the prefix.
      if (withSt === '说书人') return `说书人${opt.label}`
      return appendSnippet(withSt, opt.label)
    })
    setRecordPicker('root')
  }

  function pickPlayerAction(opt: PlayerRecordAction) {
    const player = pendingPlayerId
      ? match.players.find((p) => p.id === pendingPlayerId)
      : undefined
    if (!player) {
      setRecordPicker('root')
      setPendingPlayerId(null)
      return
    }
    // Insert the nickname into the editable draft; log rendering matches bare
    // names to role icon + name(role). Custom-text actor/targets still use @# tokens.
    const who = player.name
    if (opt.id === 'custom') {
      insertIntoDraft(who)
      setDraftIcons((prev) =>
        prev.includes('custom') ? prev : [...prev, 'custom'],
      )
      setRecordPicker('root')
      setPendingPlayerId(null)
      return
    }
    insertIntoDraft(`${who}${opt.label}`)
    setDraftIcons((prev) =>
      prev.includes(opt.id) ? prev : [...prev, opt.id],
    )
    setRecordPicker('root')
    setPendingPlayerId(null)
  }

  function submitComposer() {
    if (!composer) return

    if (composer.mode === 'custom') {
      const refOf = (id: string) => (id ? playerMentionToken(id) : '')
      const finalText = composeCustomTextLog({
        actorName: refOf(actorId),
        actionId,
        targetNames: targetIds.map(refOf),
        text,
      })
      if (!finalText) return
      const filledTargets = targetIds.filter((id) => id.length > 0)
      onRecordEvent({
        phaseId: composer.phaseId,
        typeId: 'custom',
        text: finalText,
        actorPlayerIds: actorId ? [actorId] : undefined,
        targetPlayerIds: filledTargets.length > 0 ? filledTargets : undefined,
        payload: {
          ...(actionId ? { actionId } : {}),
        },
      })
      setComposer(null)
      setText('')
      setActionId('')
      setTargetIds([''])
      setTargetSlotIndex(0)
      setDraftIcons([])
      setPendingPlayerId(null)
      setRecordPicker('root')
      return
    }

    const raw = text.trim()
    if (!raw) return
    const finalText =
      endWithPeriod && !/[。.!！？?]$/.test(raw) ? `${raw}。` : raw
    const filledTargets = targetIds.filter((id) => id.length > 0)
    onRecordEvent({
      phaseId: composer.phaseId,
      typeId: 'announce',
      text: finalText,
      actorPlayerIds: actorId ? [actorId] : undefined,
      targetPlayerIds: filledTargets.length > 0 ? filledTargets : undefined,
      payload: draftIcons.length > 0 ? { logIcons: draftIcons } : undefined,
    })
    setComposer(null)
    setText('')
    setDraftIcons([])
    setPendingPlayerId(null)
    setRecordPicker('root')
  }

  const pendingPlayer = pendingPlayerId
    ? match.players.find((p) => p.id === pendingPlayerId)
    : undefined

  return (
    <div className="flex flex-col gap-0 lg:grid lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
      <div className="mb-3 lg:mb-0">
        <SeatingStatusPanel
          match={match}
          selectedPlayerId={selectedPlayerId || undefined}
          pickFieldLabel={
            composer?.mode === 'record'
              ? '选择玩家动作'
              : pickField === 'actor'
                ? '行动者'
                : targetIds.length === 0
                  ? '目标（先点 + 添加）'
                  : `目标 ${targetSlotIndex + 1}`
          }
          onSelectPlayer={(playerId) => {
            const player = match.players.find((p) => p.id === playerId)
            if (!composer) {
              const phaseId = lastPhaseId ?? match.phases[0]?.id
              if (!phaseId || !player) return
              setComposer({ phaseId, mode: 'record' })
              setActorId('')
              setActionId('')
              setPickField('target')
              setEndWithPeriod(true)
              setDraftIcons([])
              setText('')
              openPlayerActionPicker(player)
              return
            }
            if (composer.mode === 'record') {
              if (player) openPlayerActionPicker(player)
              return
            }
            if (pickField === 'actor') {
              setActorId(playerId)
              return
            }
            if (targetIds.length === 0) {
              setTargetIds([playerId])
              setTargetSlotIndex(0)
              return
            }
            setTargetAt(targetSlotIndex, playerId)
          }}
        />
      </div>

      <div className="min-w-0">
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
                    {events.map((event) => {
                      const icons = readLogIcons(event.payload)
                      const moveUp = moveFlags.get(event.id)?.up ?? false
                      const moveDown = moveFlags.get(event.id)?.down ?? false
                      return (
                        <li
                          key={event.id}
                          className="flex items-start gap-2 rounded-md bg-[var(--bg-deep)]/60 px-3 py-2.5 text-sm leading-snug"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="mr-2 inline-flex items-center gap-1 align-middle text-xs text-[var(--accent-soft)]">
                              {icons.map((iconId) => (
                                <PlayerActionIcon
                                  key={`${event.id}-${iconId}`}
                                  id={iconId}
                                  className="size-3.5 text-[var(--accent-soft)]"
                                />
                              ))}
                              {EventTypeRegistry.get(event.typeId)?.label ??
                                event.typeId}
                            </span>
                            {event.text ? (
                              <EventLogText
                                text={event.text}
                                roles={match.script.roles}
                                players={match.players}
                              />
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              disabled={!moveUp}
                              onClick={() => onMoveEvent(event.id, 'up')}
                              className="min-h-9 min-w-9 rounded-md px-1.5 text-sm text-[var(--ink-muted)] touch-manipulation disabled:opacity-30"
                              aria-label="上移这条记录"
                              title="上移"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={!moveDown}
                              onClick={() => onMoveEvent(event.id, 'down')}
                              className="min-h-9 min-w-9 rounded-md px-1.5 text-sm text-[var(--ink-muted)] touch-manipulation disabled:opacity-30"
                              aria-label="下移这条记录"
                              title="下移"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  !confirm(
                                    '删除这条记录？相关状态会按剩余事件重新计算。',
                                  )
                                ) {
                                  return
                                }
                                onRemoveEvent(event.id)
                              }}
                              className="min-h-9 shrink-0 rounded-md px-2 text-xs text-[var(--danger)] touch-manipulation"
                              aria-label="删除这条记录"
                            >
                              删除
                            </button>
                          </div>
                        </li>
                      )
                    })}
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
          className="mt-4 min-h-12 w-full rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-base font-medium text-[var(--ink)] ring-1 ring-[var(--line)] touch-manipulation lg:w-auto lg:min-w-[14rem]"
        >
          + 添加游戏阶段
        </button>
      </div>

      {composer && activePhase && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center p-3 sm:items-center"
          style={{ background: 'var(--overlay)' }}
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
                {draftIcons.length > 0 && (
                  <div
                    className="mt-2 flex flex-wrap items-center gap-1.5"
                    aria-label="已选图标"
                  >
                    {draftIcons.map((iconId) => (
                      <span
                        key={iconId}
                        className="inline-flex items-center gap-1 rounded border border-[var(--line)] bg-[var(--bg-elevated)] px-1.5 py-1 text-[var(--ink)]"
                        title={
                          PLAYER_RECORD_ACTIONS.find((a) => a.id === iconId)
                            ?.label ?? iconId
                        }
                      >
                        <PlayerActionIcon id={iconId} />
                      </span>
                    ))}
                  </div>
                )}
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
                  {recordPicker === 'storyteller'
                    ? '说书人待选择 — 点一项继续，或返回改选其他对象'
                    : recordPicker === 'player' && pendingPlayer
                      ? `${playerLogLabel(match, pendingPlayer)}待选择 — 点一项写入记录（含图标）`
                      : '点选上方圆桌座位，为该玩家选择动作'}
                </p>

                {recordPicker === 'storyteller' ? (
                  <div className="overflow-hidden rounded-md border border-[var(--line)]">
                    {STORYTELLER_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => pickStorytellerOption(opt)}
                        className={`flex min-h-12 w-full items-center px-3 py-2.5 text-left text-sm text-[var(--ink)] touch-manipulation ${
                          i > 0 ? 'border-t border-[var(--line)]' : ''
                        } ${
                          opt.id === 'custom'
                            ? 'bg-[var(--bg-elevated)] text-[var(--accent-soft)]'
                            : 'bg-[var(--bg-deep)]/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRecordPicker('root')}
                      className="flex min-h-11 w-full items-center justify-center border-t border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--ink-muted)] touch-manipulation"
                    >
                      返回对象选择
                    </button>
                  </div>
                ) : recordPicker === 'player' ? (
                  <div className="overflow-hidden rounded-md border border-[var(--line)]">
                    {PLAYER_RECORD_ACTIONS.map((opt, i) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => pickPlayerAction(opt)}
                        className={`flex min-h-12 w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[var(--ink)] touch-manipulation ${
                          i > 0 ? 'border-t border-[var(--line)]' : ''
                        } bg-[var(--bg-deep)]/40`}
                      >
                        <PlayerActionIcon
                          id={opt.id}
                          className="size-4 shrink-0 text-[var(--ink-muted)]"
                        />
                        <span className="min-w-0 flex-1">{opt.label}</span>
                        <span className="shrink-0 text-xs text-[var(--ink-muted)]">
                          {opt.tag}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setRecordPicker('root')
                        setPendingPlayerId(null)
                      }}
                      className="flex min-h-11 w-full items-center justify-center border-t border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--ink-muted)] touch-manipulation"
                    >
                      返回对象选择
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {RECORD_QUICK.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (opt.id === 'storyteller') {
                              openStorytellerPicker()
                              return
                            }
                            insertIntoDraft(
                              resolveQuickSnippet(match, opt.id),
                            )
                          }}
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
                      onClick={() =>
                        insertIntoDraft(buildFieldStatsReport(match))
                      }
                      className="mt-2 min-h-11 w-full rounded-md border border-dashed border-[var(--line)] bg-transparent px-3 py-2 text-sm text-[var(--ink-muted)] touch-manipulation"
                    >
                      插入场上信息统计报告
                    </button>
                  </>
                )}

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
                      pickField === 'actor'
                        ? 'text-[var(--accent-soft)] underline'
                        : 'text-[var(--ink-muted)]'
                    }`}
                    onClick={() => setPickField('actor')}
                  >
                    行动者
                  </button>
                  /
                  <button
                    type="button"
                    className={`mx-1 underline-offset-2 touch-manipulation ${
                      pickField === 'target'
                        ? 'text-[var(--accent-soft)] underline'
                        : 'text-[var(--ink-muted)]'
                    }`}
                    onClick={() => {
                      if (targetIds.length === 0) addTargetSlot()
                      else setPickField('target')
                    }}
                  >
                    目标
                    {targetIds.length > 0 ? ` ${targetSlotIndex + 1}` : ''}
                  </button>
                </p>

                <div className="flex flex-col gap-2">
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
                    行动
                    <select
                      className="mt-1 min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
                      value={actionId}
                      onChange={(e) => setActionId(e.target.value)}
                    >
                      <option value="">（无）</option>
                      {customTextActions.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="text-xs text-[var(--ink-muted)]">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span>目标</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={addTargetSlot}
                          className="min-h-9 min-w-9 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] text-sm text-[var(--ink)] touch-manipulation"
                          aria-label="添加目标"
                          title="添加目标"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          disabled={targetIds.length === 0}
                          onClick={() =>
                            removeTargetSlot(
                              Math.min(
                                targetSlotIndex,
                                Math.max(0, targetIds.length - 1),
                              ),
                            )
                          }
                          className="min-h-9 min-w-9 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] text-sm text-[var(--ink)] touch-manipulation disabled:opacity-40"
                          aria-label="移除当前目标"
                          title="移除当前目标"
                        >
                          −
                        </button>
                      </div>
                    </div>
                    {targetIds.length === 0 ? (
                      <p className="rounded-md border border-dashed border-[var(--line)] bg-[var(--bg-deep)]/40 px-2 py-2 text-[var(--ink-muted)]">
                        无目标槽 — 点 + 添加，或仅写文本
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {targetIds.map((tid, index) => (
                          <li key={`target-slot-${index}`} className="flex gap-1.5">
                            <select
                              className={`min-h-11 min-w-0 flex-1 rounded-md border px-2 py-2 text-base text-[var(--ink)] sm:text-sm ${
                                pickField === 'target' &&
                                targetSlotIndex === index
                                  ? 'border-[var(--accent-soft)] bg-[var(--bg-deep)]'
                                  : 'border-[var(--line)] bg-[var(--bg-deep)]'
                              }`}
                              value={tid}
                              onFocus={() => {
                                setPickField('target')
                                setTargetSlotIndex(index)
                              }}
                              onChange={(e) =>
                                setTargetAt(index, e.target.value)
                              }
                              aria-label={`目标 ${index + 1}`}
                            >
                              <option value="">（无）</option>
                              {sortedPlayers.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {playerOptionLabel(match, p)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeTargetSlot(index)}
                              className="min-h-11 shrink-0 rounded-md border border-[var(--line)] px-2 text-xs text-[var(--ink-muted)] touch-manipulation"
                              aria-label={`移除目标 ${index + 1}`}
                            >
                              移除
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <label className="mt-2 block text-xs text-[var(--ink-muted)]">
                  文本
                  <span className="ml-1 font-normal text-[var(--ink-muted)]/80">
                    （输入 @ 可引用剧本角色）
                  </span>
                  <RoleMentionInput
                    className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-2 py-2 text-base text-[var(--ink)] sm:text-sm"
                    rows={3}
                    value={text}
                    onChange={setText}
                    roles={match.script.roles}
                    placeholder="写下本阶段备注… 可用 @角色"
                    aria-label="自定义文本"
                  />
                </label>

                {composedCustomPreview ? (
                  <p className="mt-2 rounded-md bg-[var(--bg-deep)]/60 px-2.5 py-2 text-sm leading-snug text-[var(--ink)]">
                    <span className="mr-2 text-xs text-[var(--ink-muted)]">
                      预览
                    </span>
                    <EventLogText
                      text={composedCustomPreview}
                      roles={match.script.roles}
                      players={match.players}
                    />
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={!composedCustomPreview}
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
