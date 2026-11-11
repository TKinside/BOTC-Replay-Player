import type { CSSProperties } from 'react'
import type { Match, Player, RoleDef } from '@/domain'
import { FACTION_COLOR } from '../lib/factionColor'

interface SeatingCircleProps {
  match: Match
  selectedPlayerId?: string
  onSelectPlayer: (playerId: string) => void
}

export function SeatingCircle({
  match,
  selectedPlayerId,
  onSelectPlayer,
}: SeatingCircleProps) {
  const players = match.players
    .slice()
    .sort((a, b) => a.seatIndex - b.seatIndex)
  const n = Math.max(players.length, 1)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div className="absolute inset-[18%] rounded-full border border-dashed border-[var(--line)] bg-[var(--bg-panel)]/60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-xs text-[var(--ink-muted)]">
          <div className="text-sm text-[var(--ink)]">{match.script.name}</div>
          <div>{players.length} 人</div>
        </div>
      </div>
      {players.map((player, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const radius = 42
        const x = 50 + radius * Math.cos(angle)
        const y = 50 + radius * Math.sin(angle)
        const role = match.script.roles.find((r) => r.id === player.roleId)
        return (
          <SeatToken
            key={player.id}
            player={player}
            role={role}
            selected={player.id === selectedPlayerId}
            showSeat={match.settings.showSeatNumbers}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelectPlayer(player.id)}
          />
        )
      })}
      {players.length === 0 && (
        <p className="absolute inset-x-0 bottom-2 text-center text-xs text-[var(--ink-muted)]">
          添加玩家后会出现在圆桌上
        </p>
      )}
    </div>
  )
}

function SeatToken({
  player,
  role,
  selected,
  showSeat,
  style,
  onClick,
}: {
  player: Player
  role?: RoleDef
  selected: boolean
  showSeat: boolean
  style: CSSProperties
  onClick: () => void
}) {
  const color = role ? FACTION_COLOR[role.faction] : '#64748b'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute flex w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-center transition ${
        selected
          ? 'border-[var(--accent-soft)] bg-[var(--bg-elevated)]'
          : 'border-[var(--line)] bg-[var(--bg-panel)]'
      }`}
      style={style}
    >
      <span
        className="flex size-9 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ background: color }}
      >
        {showSeat ? player.seatIndex + 1 : role?.name.slice(0, 1) || '?'}
      </span>
      <span className="w-full truncate text-[11px] font-medium leading-tight">
        {player.name}
      </span>
      <span className="w-full truncate text-[10px] leading-tight text-[var(--ink-muted)]">
        {role?.name ?? '未指派'}
      </span>
    </button>
  )
}
