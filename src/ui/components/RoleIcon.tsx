import { useMemo, useState } from 'react'
import type { FactionId, RoleDef } from '@/domain'
import {
  compositeIconResolver,
  roleIconCandidates,
} from '@/adapters/icons'
import { FACTION_COLOR } from '../lib/factionColor'

interface RoleIconProps {
  role?: Pick<RoleDef, 'id' | 'name' | 'faction' | 'imageUrl'> | null
  roleId?: string
  faction?: FactionId
  size?: number
  className?: string
  /** Seat number overlay when no art loaded. */
  seatLabel?: string | number
}

/**
 * Renders local pack art when present, otherwise faction placeholder.
 * Tries webp/png/svg/jpg under public/icons/roles/.
 */
export function RoleIcon(props: RoleIconProps) {
  const id = props.role?.id ?? props.roleId ?? ''
  const team = props.role?.faction ?? props.faction ?? 'unknown'
  const resolved = compositeIconResolver.resolve(id, team, props.role?.imageUrl)
  const candidates = useMemo(() => {
    if (!id) return [] as string[]
    if (resolved.kind === 'url') return [resolved.value]
    return roleIconCandidates(id)
  }, [id, resolved.kind, resolved.value])

  return (
    <RoleIconInner
      key={candidates.join('|') || `ph-${id}-${team}`}
      {...props}
      candidates={candidates}
      team={team}
      id={id}
    />
  )
}

function RoleIconInner({
  role,
  size = 36,
  className = '',
  seatLabel,
  candidates,
  team,
  id,
}: RoleIconProps & {
  candidates: string[]
  team: FactionId
  id: string
}) {
  const color = FACTION_COLOR[team]
  const [srcIndex, setSrcIndex] = useState(0)
  const failed = candidates.length === 0 || srcIndex >= candidates.length
  const src = failed ? undefined : candidates[srcIndex]

  if (src) {
    return (
      <img
        src={src}
        alt={role?.name ?? id}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, background: color }}
        onError={() => setSrcIndex((i) => i + 1)}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: color }}
      aria-label={role?.name ?? (id || '未指派')}
    >
      {seatLabel ?? role?.name?.slice(0, 1) ?? '?'}
    </span>
  )
}
