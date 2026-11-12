import { useMemo, type CSSProperties } from 'react'
import {
  reducePlayerStatuses,
  type Match,
  type Player,
  type RoleDef,
} from '@/domain'
import { StatusEffectRegistry } from '@/registries'
import { RoleIcon } from './RoleIcon'

interface SeatingCircleProps {
  match: Match
  selectedPlayerId?: string
  onSelectPlayer: (playerId: string) => void
  /** Slightly denser layout for embedding under other tabs (e.g. 日志). */
  compact?: boolean
}

export function SeatingCircle({
  match,
  selectedPlayerId,
  onSelectPlayer,
  compact = false,
}: SeatingCircleProps) {
  const players = match.players
    .slice()
    .sort((a, b) => a.seatIndex - b.seatIndex)
  const n = Math.max(players.length, 1)
  // Keep tokens inside the circle and readable on narrow phones.
  const radius = players.length <= 6 ? 38 : players.length <= 12 ? 40 : 42
  const tokenWidth = players.length >= 12 ? '3.75rem' : '4.25rem'
  const statusByPlayer = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const row of reducePlayerStatuses(match.events)) {
      map.set(row.playerId, row.statuses)
    }
    return map
  }, [match.events])

  return (
    <div
      className={`relative mx-auto aspect-square w-full touch-manipulation ${
        compact ? 'max-w-[20rem]' : 'max-w-[22rem]'
      }`}
      style={{ minHeight: compact ? 240 : 280 }}
    >
      <div className="absolute inset-[16%] rounded-full border border-dashed border-[var(--line)] bg-[var(--bg-panel)]/60" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="max-w-[40%] text-center text-xs text-[var(--ink-muted)]">
          <div className="truncate text-sm text-[var(--ink)]">
            {match.script.name}
          </div>
          <div>{players.length} 人</div>
        </div>
      </div>
      {players.map((player, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const x = 50 + radius * Math.cos(angle)
        const y = 50 + radius * Math.sin(angle)
        const role = match.script.roles.find((r) => r.id === player.roleId)
        return (
          <SeatToken
            key={player.id}
            player={player}
            role={role}
            statuses={statusByPlayer.get(player.id) ?? []}
            selected={player.id === selectedPlayerId}
            showSeat={match.settings.showSeatNumbers}
            tokenWidth={tokenWidth}
            iconSize={compact ? 36 : 40}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelectPlayer(player.id)}
          />
        )
      })}
      {players.length === 0 && (
        <p className="absolute inset-x-0 bottom-3 text-center text-xs text-[var(--ink-muted)]">
          添加玩家后会出现在圆桌上
        </p>
      )}
    </div>
  )
}

function SeatToken({
  player,
  role,
  statuses,
  selected,
  showSeat,
  tokenWidth,
  iconSize,
  style,
  onClick,
}: {
  player: Player
  role?: RoleDef
  statuses: string[]
  selected: boolean
  showSeat: boolean
  tokenWidth: string
  iconSize: number
  style: CSSProperties
  onClick: () => void
}) {
  const dead = statuses.includes('dead')
  const statusLabels = statuses
    .map((id) => StatusEffectRegistry.get(id)?.label)
    .filter((label): label is string => Boolean(label))

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      // Selection = border only. Do not recolor the role icon disc.
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl border bg-transparent px-1 py-1.5 text-center transition active:scale-95 ${
        selected
          ? 'border-[var(--accent-soft)]'
          : 'border-[var(--line)]'
      } ${dead ? 'opacity-55' : ''}`}
      style={{ ...style, width: tokenWidth, minHeight: 64 }}
    >
      <RoleIcon
        role={role}
        size={iconSize}
        seatLabel={showSeat ? player.seatIndex + 1 : undefined}
      />
      <span className="w-full truncate text-[11px] font-medium leading-tight">
        {player.name}
      </span>
      <span className="w-full truncate text-[10px] leading-tight text-[var(--ink-muted)]">
        {role?.name ?? '未指派'}
      </span>
      {statusLabels.length > 0 && (
        <span className="w-full truncate text-[9px] leading-tight text-[var(--accent-soft)]">
          {statusLabels.join('·')}
        </span>
      )}
    </button>
  )
}
