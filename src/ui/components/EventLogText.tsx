import type { RoleDef } from '@/domain'
import { parseRoleMentions } from '../lib/customTextCompose'
import { RoleIcon } from './RoleIcon'

/**
 * Renders event log text, expanding `@角色名` into role icon + name.
 */
export function EventLogText({
  text,
  roles,
  iconSize = 16,
}: {
  text: string
  roles: readonly RoleDef[]
  iconSize?: number
}) {
  const segments = parseRoleMentions(text, roles)
  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <span key={`t-${i}`}>{seg.value}</span>
        }
        return (
          <span
            key={`m-${i}-${seg.role.id}`}
            className="inline-flex items-center gap-0.5 align-middle"
            title={seg.role.name}
          >
            <RoleIcon role={seg.role} size={iconSize} className="mx-px" />
            <span>{seg.role.name}</span>
          </span>
        )
      })}
    </span>
  )
}
