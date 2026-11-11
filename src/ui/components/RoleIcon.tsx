import { useMemo, useState, type CSSProperties } from 'react'
import type { FactionId, RoleDef } from '@/domain'
import { compositeIconResolver } from '@/adapters/icons'

/** Parchment circular disc behind every role token (public/icons/). */
const ROLE_DISC_BG = `${import.meta.env.BASE_URL}icons/role-disc-bg.webp`

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
 * Role art on the parchment disc:
 * Script JSON `image` / local pack → placeholder label on the same disc.
 * Selection borders belong on the parent (seat/chip), never recolor this disc.
 */
export function RoleIcon(props: RoleIconProps) {
  const id = props.role?.id ?? props.roleId ?? ''
  const team = props.role?.faction ?? props.faction ?? 'unknown'
  const candidates = useMemo(
    () => compositeIconResolver.candidates(id, props.role?.imageUrl),
    [id, props.role?.imageUrl],
  )

  return (
    <RoleIconInner
      key={candidates.join('|') || `ph-${id}-${team}`}
      {...props}
      candidates={candidates}
      id={id}
    />
  )
}

function discStyle(size: number): CSSProperties {
  return {
    width: size,
    height: size,
    backgroundImage: `url(${ROLE_DISC_BG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}

function RoleIconInner({
  role,
  size = 36,
  className = '',
  seatLabel,
  candidates,
  id,
}: RoleIconProps & {
  candidates: string[]
  id: string
}) {
  const [srcIndex, setSrcIndex] = useState(0)
  const failed = candidates.length === 0 || srcIndex >= candidates.length
  const src = failed ? undefined : candidates[srcIndex]

  if (src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
        style={discStyle(size)}
      >
        <img
          src={src}
          alt={role?.name ?? id}
          width={size}
          height={size}
          className="size-full rounded-full object-contain"
          referrerPolicy="no-referrer"
          onError={() => setSrcIndex((i) => i + 1)}
        />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-[#3a2f28] ${className}`}
      style={discStyle(size)}
      aria-label={role?.name ?? (id || '未指派')}
    >
      {seatLabel ?? role?.name?.slice(0, 1) ?? '?'}
    </span>
  )
}
