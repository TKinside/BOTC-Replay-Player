import type { RoleDef } from '@/domain'
import { FACTION_COLOR } from '../lib/factionColor'

export function RoleChip({ role }: { role: RoleDef }) {
  const color = FACTION_COLOR[role.faction]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
      style={{ background: `${color}22`, color }}
    >
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {role.name}
    </span>
  )
}
