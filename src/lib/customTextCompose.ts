import type { FactionId, Player, RoleDef } from '@/domain'
import { CustomTextActionRegistry } from '@/registries'

/** Stable token for a player mention in stored log text: `@#<playerId>`. */
export const PLAYER_MENTION_PREFIX = '@#'

export function playerMentionToken(playerId: string): string {
  return `${PLAYER_MENTION_PREFIX}${playerId}`
}

export type CustomTextComposeInput = {
  /** Actor display string (use `playerMentionToken(id)` so the log can render icons). */
  actorName?: string
  /** Action id from CustomTextActionRegistry; empty = no verb. */
  actionId?: string
  /** Target display strings (prefer player mention tokens). */
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
  if (body) result += body
  return result
}

export type LogTextSegment =
  | { kind: 'text'; value: string }
  | { kind: 'role'; role: RoleDef; raw: string }
  | { kind: 'player'; player: Player; role?: RoleDef; raw: string }

/** @deprecated use parseLogText; kept for existing tests calling parseRoleMentions. */
export function parseRoleMentions(
  text: string,
  roles: readonly RoleDef[],
): Array<
  { kind: 'text'; value: string } | { kind: 'mention'; role: RoleDef; raw: string }
> {
  return parseLogText(text, { roles, players: [] }).map((seg) => {
    if (seg.kind === 'role') return { kind: 'mention', role: seg.role, raw: seg.raw }
    if (seg.kind === 'player') {
      return { kind: 'text', value: formatPlayerPlain(seg.player, seg.role) }
    }
    return seg
  })
}

export type ParseLogTextContext = {
  roles: readonly RoleDef[]
  players: readonly Player[]
}

/**
 * Split log text into plain runs, `@角色名` role mentions, `@#playerId` player
 * mentions, and bare player-name matches (longest name wins).
 */
export function parseLogText(
  text: string,
  ctx: ParseLogTextContext,
): LogTextSegment[] {
  if (!text) return []
  const roles = ctx.roles
    .filter((r) => r.name.trim().length > 0)
    .slice()
    .sort((a, b) => b.name.length - a.name.length)
  const playersByIdLen = ctx.players
    .slice()
    .sort((a, b) => b.id.length - a.id.length)
  const playersByNameLen = ctx.players
    .filter((p) => p.name.trim().length > 0)
    .slice()
    .sort((a, b) => b.name.length - a.name.length)

  const roleById = new Map(ctx.roles.map((r) => [r.id, r]))

  const tokenSegments: LogTextSegment[] = []
  let i = 0
  while (i < text.length) {
    if (text.startsWith(PLAYER_MENTION_PREFIX, i)) {
      const rest = text.slice(i + PLAYER_MENTION_PREFIX.length)
      const hit = playersByIdLen.find((p) => rest.startsWith(p.id))
      if (hit) {
        const role = hit.roleId ? roleById.get(hit.roleId) : undefined
        tokenSegments.push({
          kind: 'player',
          player: hit,
          role,
          raw: playerMentionToken(hit.id),
        })
        i += PLAYER_MENTION_PREFIX.length + hit.id.length
        continue
      }
    }
    if (text[i] === '@') {
      const rest = text.slice(i + 1)
      const hit = roles.find((r) => rest.startsWith(r.name))
      if (hit) {
        tokenSegments.push({ kind: 'role', role: hit, raw: `@${hit.name}` })
        i += 1 + hit.name.length
        continue
      }
      tokenSegments.push({ kind: 'text', value: '@' })
      i += 1
      continue
    }
    const nextAt = text.indexOf('@', i + 1)
    const end = nextAt === -1 ? text.length : nextAt
    tokenSegments.push({ kind: 'text', value: text.slice(i, end) })
    i = end
  }

  const withNames: LogTextSegment[] = []
  for (const seg of mergeAdjacentText(tokenSegments)) {
    if (seg.kind !== 'text') {
      withNames.push(seg)
      continue
    }
    withNames.push(
      ...splitBarePlayerNames(seg.value, playersByNameLen, roleById),
    )
  }
  return mergeAdjacentText(withNames)
}

/** Skip bare-name matching for nicknames that collide with digits/short ASCII. */
export function canBareMatchPlayerName(name: string): boolean {
  const n = name.trim()
  if (!n) return false
  // "1" / "222" would match inside「（5票）」or other numbers — require tokens.
  if (/^\d+$/.test(n)) return false
  if (/^[A-Za-z0-9._-]+$/.test(n) && n.length <= 2) return false
  return true
}

function splitBarePlayerNames(
  text: string,
  playersByNameLen: readonly Player[],
  roleById: Map<string, RoleDef>,
): LogTextSegment[] {
  const matchable = playersByNameLen.filter((p) =>
    canBareMatchPlayerName(p.name),
  )
  if (!text || matchable.length === 0) {
    return text ? [{ kind: 'text', value: text }] : []
  }
  const out: LogTextSegment[] = []
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    const hit = matchable.find((p) => rest.startsWith(p.name))
    if (hit) {
      const role = hit.roleId ? roleById.get(hit.roleId) : undefined
      out.push({
        kind: 'player',
        player: hit,
        role,
        raw: hit.name,
      })
      i += hit.name.length
      continue
    }
    // Advance to next possible name start (any char); cheap scan.
    let next = text.length
    for (const p of matchable) {
      const at = text.indexOf(p.name, i + 1)
      if (at !== -1 && at < next) next = at
    }
    out.push({ kind: 'text', value: text.slice(i, next) })
    i = next
  }
  return out
}

function mergeAdjacentText(segments: LogTextSegment[]): LogTextSegment[] {
  const out: LogTextSegment[] = []
  for (const seg of segments) {
    const last = out[out.length - 1]
    if (seg.kind === 'text' && last?.kind === 'text') {
      last.value += seg.value
    } else if (seg.kind === 'text') {
      out.push({ kind: 'text', value: seg.value })
    } else {
      out.push(seg)
    }
  }
  return out
}

/** Plain export form: `name` or `name(role)` — no icon tokens. */
export function formatPlayerPlain(player: Player, role?: RoleDef): string {
  if (!role) return player.name
  return `${player.name}(${role.name})`
}

/** Expand stored log text (tokens + @roles) to plain Chinese for PNG export. */
export function expandLogTextPlain(
  text: string,
  ctx: ParseLogTextContext,
): string {
  return parseLogText(text, ctx)
    .map((seg) => {
      if (seg.kind === 'text') return seg.value
      if (seg.kind === 'role') return seg.role.name
      return formatPlayerPlain(seg.player, seg.role)
    })
    .join('')
}

/** Chip color for a player/role mention — good blue / evil red like the mini-program log. */
export function logMentionColor(faction?: FactionId): string | undefined {
  if (!faction || faction === 'unknown') return undefined
  if (faction === 'townsfolk' || faction === 'outsider') return 'var(--good)'
  if (faction === 'minion' || faction === 'demon') return 'var(--evil)'
  // Travelers / fabled / loric — distinct but muted.
  if (faction === 'traveler') return '#c084fc'
  if (faction === 'fabled') return '#eab308'
  if (faction === 'loric') return '#14b8a6'
  return undefined
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
 * Returns null when not in a mention context (or when typing a `@#` player token).
 */
export function activeMentionAt(
  value: string,
  cursor: number,
): { start: number; query: string } | null {
  const before = value.slice(0, cursor)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  if (before[at + 1] === '#') return null
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
