import { useMemo } from 'react'
import {
  reducePlayerStatuses,
  type Match,
  type Player,
} from '@/domain'
import { StatusEffectRegistry } from '@/registries'
import { RoleIcon } from './RoleIcon'

type Props = {
  match: Match
  selectedPlayerId?: string
  onSelectPlayer: (playerId: string) => void
  /** Which field seat taps currently fill — shown in the sticky caption. */
  pickFieldLabel: string
}

/**
 * Sticky, scannable 圆桌状态 for the log tab.
 * A full seating circle scrolls away on mobile; this stays under the tab bar
 * so nicknames / roles / statuses remain visible while recording events.
 */
export function SeatingStatusPanel({
  match,
  selectedPlayerId,
  onSelectPlayer,
  pickFieldLabel,
}: Props) {
  const players = useMemo(
    () => match.players.slice().sort((a, b) => a.seatIndex - b.seatIndex),
    [match.players],
  )
  const statusByPlayer = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const row of reducePlayerStatuses(match.events)) {
      map.set(row.playerId, row.statuses)
    }
    return map
  }, [match.events])

  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-panel)] px-3 py-3 text-center text-xs text-[var(--ink-muted)]">
        圆桌尚无玩家 — 请先到「圆桌」加人并指派角色
      </div>
    )
  }

  return (
    <section
      aria-label="圆桌状态"
      className="sticky top-11 z-10 -mx-1 border-b border-[var(--line)] bg-[var(--bg-deep)]/95 px-1 pb-2 pt-1 backdrop-blur-sm"
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-0.5">
        <h3 className="text-sm font-medium text-[var(--ink)]">圆桌状态</h3>
        <p className="truncate text-xs text-[var(--ink-muted)]">
          {players.length} 人 · 点选填入{pickFieldLabel}
        </p>
      </div>
      <ul className="grid max-h-[min(42vh,20rem)] grid-cols-2 gap-1.5 overflow-y-auto overscroll-contain pr-0.5">
        {players.map((player) => (
          <SeatStatusChip
            key={player.id}
            match={match}
            player={player}
            statuses={statusByPlayer.get(player.id) ?? []}
            selected={player.id === selectedPlayerId}
            onSelect={() => onSelectPlayer(player.id)}
          />
        ))}
      </ul>
    </section>
  )
}

function SeatStatusChip({
  match,
  player,
  statuses,
  selected,
  onSelect,
}: {
  match: Match
  player: Player
  statuses: string[]
  selected: boolean
  onSelect: () => void
}) {
  const role = match.script.roles.find((r) => r.id === player.roleId)
  const dead = statuses.includes('dead')
  const statusLabels = statuses
    .map((id) => StatusEffectRegistry.get(id)?.label)
    .filter((label): label is string => Boolean(label))

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`flex min-h-12 w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left touch-manipulation transition active:scale-[0.98] ${
          selected
            ? 'border-[var(--accent-soft)] bg-[var(--bg-elevated)]'
            : 'border-[var(--line)] bg-[var(--bg-panel)]'
        } ${dead ? 'opacity-60' : ''}`}
      >
        <RoleIcon
          role={role}
          size={32}
          seatLabel={
            match.settings.showSeatNumbers ? player.seatIndex + 1 : undefined
          }
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium leading-tight text-[var(--ink)]">
            {match.settings.showSeatNumbers
              ? `${player.seatIndex + 1}. ${player.name}`
              : player.name}
          </span>
          <span className="block truncate text-[10px] leading-tight text-[var(--ink-muted)]">
            {role?.name ?? '未指派'}
            {statusLabels.length > 0 ? ` · ${statusLabels.join('·')}` : ''}
          </span>
        </span>
      </button>
    </li>
  )
}
