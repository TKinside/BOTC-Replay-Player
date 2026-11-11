import { useMemo, useState } from 'react'
import type { FactionId, RoleDef } from '@/domain'
import { compositeIconResolver } from '@/adapters/icons'

/** Neutral placeholder when no image loads — not faction-tinted. */
const PLACEHOLDER_BG = '#64748b'

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
 * Renders role art with fallbacks:
 * Script JSON `image` URL (on by default) → local pack → neutral placeholder.
 *
 * Image-backed icons always sit on an opaque white circular disc — never
 * faction/selected tints (those belong on borders/labels only).
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
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ${className}`}
        style={{ width: size, height: size, backgroundColor: '#ffffff' }}
        aria-hidden={false}
      >
        <img
          src={src}
          alt={role?.name ?? id}
          width={size}
          height={size}
          className="size-full rounded-full object-contain bg-white"
          style={{ backgroundColor: '#ffffff' }}
          referrerPolicy="no-referrer"
          onError={() => setSrcIndex((i) => i + 1)}
        />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: PLACEHOLDER_BG }}
      aria-label={role?.name ?? (id || '未指派')}
    >
      {seatLabel ?? role?.name?.slice(0, 1) ?? '?'}
    </span>
  )
}
