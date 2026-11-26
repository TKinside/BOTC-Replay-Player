import type { RoleDef } from '@/domain'
import { CustomTextActionRegistry } from '@/registries'

export type CustomTextComposeInput = {
  /** Player display name; empty / undefined =「无」. */
  actorName?: string
  /** Action id from CustomTextActionRegistry; empty = no verb. */
  actionId?: string
  /** Target display names; empty slots ignored. */
  targetNames?: readonly (string | undefined)[]
  /** Free text (may contain `@角色名` mentions). */
  text?: string
}

/**
 * Compose the final custom-log string.
 *
 * - Both actor and targets「无」→ only free text.
 * - Valid actor → Actor + Action + targets + free text (text appended last).
 * - Targets join with顿号 when more than one (matches other Chinese log joins).
 */
export function composeCustomTextLog(input: CustomTextComposeInput): string {
  const actor = input.actorName?.trim() ?? ''
  const targets = (input.targetNames ?? [])
    .map((n) => n?.trim() ?? '')
    .filter((n) => n.length > 0)
  const body = input.text?.trim() ?? ''
  const action =
    input.actionId && input.actionId.length > 0
      ? (CustomTextActionRegistry.get(input.actionId)?.label ?? '')
      : ''

  const hasActor = actor.length > 0
  const hasTargets = targets.length > 0

  if (!hasActor && !hasTargets) return body

  const targetPart = targets.join('、')
  let result = ''
  if (hasActor) result += actor
  result += action
  result += targetPart
  if (hasActor && body) result += body
  else if (!hasActor && body) result += body
  return result
}

export type LogTextSegment =
  | { kind: 'text'; value: string }
  | { kind: 'mention'; role: RoleDef; raw: string }

/**
 * Split log text into plain runs and `@角色名` mentions resolved against script roles.
 * Longest role name wins when several names share a prefix.
 */
export function parseRoleMentions(
  text: string,
  roles: readonly RoleDef[],
): LogTextSegment[] {
  if (!text) return []
  const named = roles
    .filter((r) => r.name.trim().length > 0)
    .slice()
    .sort((a, b) => b.name.length - a.name.length)
  if (named.length === 0) return [{ kind: 'text', value: text }]

  const segments: LogTextSegment[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === '@') {
      const rest = text.slice(i + 1)
      const hit = named.find((r) => rest.startsWith(r.name))
      if (hit) {
        segments.push({ kind: 'mention', role: hit, raw: `@${hit.name}` })
        i += 1 + hit.name.length
        continue
      }
    }
    const nextAt = text.indexOf('@', i + 1)
    const end = nextAt === -1 ? text.length : nextAt
    // Consume until next @ so we can retry mention matching there.
    // If current @ did not match, treat it as plain text of length 1 then continue.
    if (text[i] === '@') {
      segments.push({ kind: 'text', value: '@' })
      i += 1
      continue
    }
    segments.push({ kind: 'text', value: text.slice(i, end) })
    i = end
  }

  return mergeAdjacentText(segments)
}

function mergeAdjacentText(segments: LogTextSegment[]): LogTextSegment[] {
  const out: LogTextSegment[] = []
  for (const seg of segments) {
    const last = out[out.length - 1]
    if (seg.kind === 'text' && last?.kind === 'text') {
      last.value += seg.value
    } else {
      out.push(seg.kind === 'text' ? { ...seg } : seg)
    }
  }
  return out
}

/** Roles whose name starts with / contains the query after `@`. */
export function filterRolesForMention(
  roles: readonly RoleDef[],
  query: string,
): RoleDef[] {
  const q = query.trim().toLowerCase()
  const list = roles.filter((r) => r.name.trim().length > 0)
  if (!q) return list.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  return list
    .filter((r) => {
      const name = r.name.toLowerCase()
      const id = r.id.toLowerCase()
      return name.includes(q) || id.includes(q) || name.startsWith(q)
    })
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return a.name.localeCompare(b.name, 'zh')
    })
}

/**
 * Find an active `@query` immediately before `cursor` in `value`.
 * Returns null when not in a mention context.
 */
export function activeMentionAt(
  value: string,
  cursor: number,
): { start: number; query: string } | null {
  const before = value.slice(0, cursor)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  const query = before.slice(at + 1)
  // Mention query cannot contain whitespace or another @.
  if (/[\s@]/.test(query)) return null
  return { start: at, query }
}

export function insertMention(
  value: string,
  cursor: number,
  roleName: string,
): { value: string; cursor: number } {
  const active = activeMentionAt(value, cursor)
  if (!active) {
    const inserted = `@${roleName}`
    const next = value.slice(0, cursor) + inserted + value.slice(cursor)
    return { value: next, cursor: cursor + inserted.length }
  }
  const before = value.slice(0, active.start)
  const after = value.slice(cursor)
  const inserted = `@${roleName}`
  return {
    value: before + inserted + after,
    cursor: before.length + inserted.length,
  }
}
