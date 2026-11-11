import type { RoleDef } from '@/domain'
import { FACTION_COLOR } from '../lib/factionColor'
import { RoleIcon } from './RoleIcon'

/**
 * Role picker chip: faction color on the **label text only**.
 * Icon disc stays white (via RoleIcon) — no faction wash behind the image.
 */
export function RoleChip({ role }: { role: RoleDef }) {
  const color = FACTION_COLOR[role.faction]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-xs">
      <RoleIcon role={role} size={18} />
      <span style={{ color }}>{role.name}</span>
    </span>
  )
}
