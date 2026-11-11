import type { RoleDef, ScriptSnapshot } from '@/domain'
import { cleanRoleId, mapTeamToFaction } from './normalize'
import { officialRoleLibrary } from './officialRoleLibrary'

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

export interface ParseTownsquareOptions {
  /** Lookup to complete known role ids. Defaults to OfficialRoleLibrary. */
  resolveOfficial?: (id: string) => RoleDef | undefined
}

export { cleanRoleId, mapTeamToFaction }

function mergeRole(
  id: string,
  partial: Partial<RoleDef> & { raw?: Record<string, unknown> },
  resolveOfficial: (id: string) => RoleDef | undefined,
  warnings: string[],
): RoleDef {
  const official = resolveOfficial(id)
  const hasCustomBody =
    typeof partial.name === 'string' &&
    partial.name.trim().length > 0 &&
    typeof partial.ability === 'string' &&
    partial.ability.trim().length > 0 &&
    partial.faction !== undefined &&
    partial.faction !== 'unknown'

  if (!official && !hasCustomBody) {
    if (!partial.name || partial.faction === 'unknown') {
      warnings.push(
        `角色「${id}」不在官方库且缺少完整自定义字段（需要 name + team + ability），已尽力保留`,
      )
    }
  }

  const faction =
    partial.faction && partial.faction !== 'unknown'
      ? partial.faction
      : (official?.faction ?? 'unknown')

  return {
    id,
    name: partial.name?.trim() || official?.name || id,
    faction,
    ability: partial.ability ?? official?.ability,
    iconKey: partial.iconKey ?? official?.iconKey ?? id,
    imageUrl: partial.imageUrl,
    reminders: partial.reminders ?? official?.reminders,
    source: official
      ? partial.name || partial.ability
        ? 'script-json'
        : 'official'
      : 'script-json',
    raw: partial.raw,
  }
}

/**
 * Parse townsquare Script JSON into an internal ScriptSnapshot.
 * Known ids are completed from the official library; custom roles keep JSON fields.
 */
export function parseTownsquareScript(
  input: TownsquareScriptInput,
  options: ParseTownsquareOptions = {},
): TownsquareParseOutcome {
  const resolveOfficial =
    options.resolveOfficial ?? ((id: string) => officialRoleLibrary.getRoleSync(id))
  const warnings: string[] = []
  const errors: string[] = []

  if (!Array.isArray(input)) {
    return { ok: false, errors: ['Script JSON 顶层必须是数组'] }
  }

  let name = '未命名脚本'
  let author: string | undefined
  let meta: Record<string, unknown> | undefined
  const roles: RoleDef[] = []
  const seen = new Set<string>()

  for (const entry of input) {
    if (typeof entry === 'string') {
      const id = cleanRoleId(entry)
      if (!id) {
        warnings.push(`跳过无法归一的角色 id: ${JSON.stringify(entry)}`)
        continue
      }
      if (seen.has(id)) {
        warnings.push(`重复角色 id 已跳过: ${id}`)
        continue
      }
      seen.add(id)
      roles.push(
        mergeRole(id, { raw: { id: entry } }, resolveOfficial, warnings),
      )
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
      if (!id) {
        warnings.push(`跳过无法归一的角色 id: ${idRaw}`)
        continue
      }
      if (seen.has(id)) {
        warnings.push(`重复角色 id 已跳过: ${id}`)
        continue
      }
      seen.add(id)

      roles.push(
        mergeRole(
          id,
          {
            name: typeof obj.name === 'string' ? obj.name : undefined,
            ability: typeof obj.ability === 'string' ? obj.ability : undefined,
            faction: mapTeamToFaction(obj.team),
            imageUrl: typeof obj.image === 'string' ? obj.image : undefined,
            reminders: Array.isArray(obj.reminders)
              ? obj.reminders.filter((r): r is string => typeof r === 'string')
              : undefined,
            raw: obj,
          },
          resolveOfficial,
          warnings,
        ),
      )
      continue
    }

    warnings.push(`跳过无法识别的数组元素: ${typeof entry}`)
  }

  if (roles.length === 0) {
    errors.push('脚本中没有可解析的角色')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
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

/** Parse from a JSON text string (paste / file). */
export function parseTownsquareScriptText(
  text: string,
  options?: ParseTownsquareOptions,
): TownsquareParseOutcome {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['不是合法的 JSON'] }
  }
  return parseTownsquareScript(parsed, options)
}

/** Adapter façade matching the plan name. */
export const TownsquareScriptAdapter = {
  parse: parseTownsquareScript,
  parseText: parseTownsquareScriptText,
  cleanRoleId,
  mapTeamToFaction,
}
