import type { RoleDef } from '@/domain'
import { FACTION_COLOR } from '../lib/factionColor'
import { RoleIcon } from './RoleIcon'

export function RoleChip({ role }: { role: RoleDef }) {
  const color = FACTION_COLOR[role.faction]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
      style={{ background: `${color}22`, color }}
    >
      <RoleIcon role={role} size={18} />
      {role.name}
    </span>
  )
}
