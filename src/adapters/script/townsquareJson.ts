import type { FactionId, RoleDef, ScriptSnapshot } from '@/domain'

/**
 * Townsquare-compatible Script JSON shapes (loose).
 * Top-level is an array: `_meta` object, role id strings, or full role objects.
 */
export type TownsquareScriptInput = unknown

export interface TownsquareParseResult {
  ok: true
  snapshot: ScriptSnapshot
  warnings: string[]
}

export interface TownsquareParseError {
  ok: false
  errors: string[]
}

export type TownsquareParseOutcome = TownsquareParseResult | TownsquareParseError

/** townsquare `clean`: lowercase + strip non [a-z0-9]. */
export function cleanRoleId(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapTeamToFaction(team: unknown): FactionId {
  if (typeof team !== 'string') return 'unknown'
  const normalized = team === 'traveller' ? 'traveler' : team
  const allowed: FactionId[] = [
    'townsfolk',
    'outsider',
    'minion',
    'demon',
    'traveler',
    'fabled',
    'loric',
    'unknown',
  ]
  return (allowed as string[]).includes(normalized)
    ? (normalized as FactionId)
    : 'unknown'
}

/**
 * Minimal stub parser for townsquare Script JSON.
 * Full merge-with-official-library behavior comes in stage A follow-up.
 */
export function parseTownsquareScript(
  input: TownsquareScriptInput,
): TownsquareParseOutcome {
  const warnings: string[] = []

  if (!Array.isArray(input)) {
    return { ok: false, errors: ['Script JSON 顶层必须是数组'] }
  }

  let name = '未命名脚本'
  let author: string | undefined
  let meta: Record<string, unknown> | undefined
  const roles: RoleDef[] = []

  for (const entry of input) {
    if (typeof entry === 'string') {
      const id = cleanRoleId(entry)
      if (!id) {
        warnings.push(`跳过无法归一的角色 id: ${JSON.stringify(entry)}`)
        continue
      }
      roles.push({
        id,
        name: id,
        faction: 'unknown',
        source: 'script-json',
        raw: { id: entry },
      })
      continue
    }

    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>
      if (obj.id === '_meta') {
        if (typeof obj.name === 'string' && obj.name.trim()) name = obj.name
        if (typeof obj.author === 'string') author = obj.author
        meta = { ...obj }
        continue
      }

      const idRaw = typeof obj.id === 'string' ? obj.id : undefined
      if (!idRaw) {
        warnings.push('跳过缺少 id 的角色对象')
        continue
      }
      const id = cleanRoleId(idRaw)
      roles.push({
        id,
        name: typeof obj.name === 'string' ? obj.name : id,
        faction: mapTeamToFaction(obj.team),
        ability: typeof obj.ability === 'string' ? obj.ability : undefined,
        imageUrl: typeof obj.image === 'string' ? obj.image : undefined,
        reminders: Array.isArray(obj.reminders)
          ? obj.reminders.filter((r): r is string => typeof r === 'string')
          : undefined,
        source: 'script-json',
        raw: obj,
      })
      continue
    }

    warnings.push(`跳过无法识别的数组元素: ${typeof entry}`)
  }

  const snapshot: ScriptSnapshot = {
    origin: { kind: 'townsquare-json' },
    id: cleanRoleId(name) || 'custom',
    name,
    author,
    roles,
    meta,
  }

  return { ok: true, snapshot, warnings }
}

/** Adapter façade matching the plan name. */
export const TownsquareScriptAdapter = {
  parse: parseTownsquareScript,
  cleanRoleId,
}
