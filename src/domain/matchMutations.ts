import type { Match, Phase, PhaseKind, Player, ScriptSnapshot } from './types'
import { touchMatch } from './reduce'

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function createPlayer(
  name: string,
  seatIndex: number,
  roleId?: string,
): Player {
  return {
    id: newId('player'),
    seatIndex,
    name,
    roleId,
  }
}

export function addPlayer(match: Match, name: string): Match {
  const seatIndex = match.players.length
  const player = createPlayer(name.trim() || `玩家${seatIndex + 1}`, seatIndex)
  return touchMatch({
    ...match,
    players: [...match.players, player],
  })
}

/**
 * Parse pasted / typed nickname text into seat-ready names.
 * Separators: newlines, Chinese 、, English commas, and whitespace runs.
 * Empty tokens after trim are dropped.
 */
export function parsePlayerNames(raw: string): string[] {
  return raw
    .split(/[\n\r、,\s]+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Append many players in seat order; skips blank names. Single save via caller. */
export function addPlayers(match: Match, names: readonly string[]): Match {
  const cleaned = names.map((n) => n.trim()).filter((n) => n.length > 0)
  if (cleaned.length === 0) return match

  let seatIndex = match.players.length
  const added = cleaned.map((name) => {
    const player = createPlayer(name, seatIndex)
    seatIndex += 1
    return player
  })

  return touchMatch({
    ...match,
    players: [...match.players, ...added],
  })
}

export function updatePlayer(
  match: Match,
  playerId: string,
  patch: Partial<Pick<Player, 'name' | 'alias' | 'roleId' | 'tags'>>,
): Match {
  return touchMatch({
    ...match,
    players: match.players.map((p) =>
      p.id === playerId ? { ...p, ...patch } : p,
    ),
  })
}

export function removePlayer(match: Match, playerId: string): Match {
  const remaining = match.players
    .filter((p) => p.id !== playerId)
    .map((p, index) => ({ ...p, seatIndex: index }))
  return touchMatch({ ...match, players: remaining })
}

export function assignRole(
  match: Match,
  playerId: string,
  roleId: string | undefined,
): Match {
  return updatePlayer(match, playerId, { roleId })
}

export function formatPhaseLabel(kind: PhaseKind, index: number): string {
  if (kind === 'setup') return '准备阶段'
  if (kind === 'end') return '终局'
  if (kind === 'night') return `第 ${index} 夜`
  return `第 ${index} 天`
}

export function formatPhaseEnLabel(kind: PhaseKind, index: number): string {
  if (kind === 'setup') return 'Setup'
  if (kind === 'end') return 'End'
  if (kind === 'night') return `Night ${index}`
  return `Day ${index}`
}

/** Advance to next night/day phase (skips setup after first advance). */
export function advancePhase(match: Match): Match {
  const last = match.phases[match.phases.length - 1]
  let kind: PhaseKind
  let index: number

  if (!last || last.kind === 'setup') {
    kind = 'night'
    index = 1
  } else if (last.kind === 'night') {
    kind = 'day'
    index = last.index
  } else if (last.kind === 'day') {
    kind = 'night'
    index = last.index + 1
  } else {
    return match
  }

  const phase: Phase = {
    id: newId('phase'),
    kind,
    index,
    label: formatPhaseLabel(kind, index),
  }

  return touchMatch({
    ...match,
    phases: [...match.phases, phase],
  })
}

/**
 * Remove a phase and its events. Only the latest phase may be removed,
 * and at least one phase (usually setup) must remain.
 */
export function removePhase(match: Match, phaseId: string): Match {
  if (match.phases.length <= 1) return match
  const last = match.phases[match.phases.length - 1]
  if (!last || last.id !== phaseId) return match
  return touchMatch({
    ...match,
    phases: match.phases.slice(0, -1),
    events: match.events.filter((e) => e.phaseId !== phaseId),
  })
}

export function setScript(match: Match, script: ScriptSnapshot): Match {
  return touchMatch({ ...match, script })
}
