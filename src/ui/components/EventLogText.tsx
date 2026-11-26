import type { Player, RoleDef } from '@/domain'
import {
  logMentionColor,
  parseLogText,
} from '@/lib/customTextCompose'
import { RoleIcon } from './RoleIcon'

/**
 * Renders event log text:
 * - `@角色名` → role icon + role name (faction-colored)
 * - `@#playerId` / bare player name → role icon + `name(role)` when assigned;
 *   plain name only when unassigned
 */
export function EventLogText({
  text,
  roles,
  players,
  iconSize = 16,
}: {
  text: string
  roles: readonly RoleDef[]
  players: readonly Player[]
  iconSize?: number
}) {
  const segments = parseLogText(text, { roles, players })
  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <span key={`t-${i}`}>{seg.value}</span>
        }
        if (seg.kind === 'role') {
          const color = logMentionColor(seg.role.faction)
          return (
            <span
              key={`r-${i}-${seg.role.id}`}
              className="inline-flex items-center gap-0.5 align-middle"
              style={color ? { color } : undefined}
              title={seg.role.name}
            >
              <RoleIcon role={seg.role} size={iconSize} className="mx-px" />
              <span>{seg.role.name}</span>
            </span>
          )
        }
        // player
        if (!seg.role) {
          return (
            <span key={`p-${i}-${seg.player.id}`}>{seg.player.name}</span>
          )
        }
        const color = logMentionColor(seg.role.faction)
        return (
          <span
            key={`p-${i}-${seg.player.id}`}
            className="inline-flex items-center gap-0.5 align-middle"
            style={color ? { color } : undefined}
            title={`${seg.player.name}(${seg.role.name})`}
          >
            <RoleIcon role={seg.role} size={iconSize} className="mx-px" />
            <span>
              {seg.player.name}({seg.role.name})
            </span>
          </span>
        )
      })}
    </span>
  )
}
