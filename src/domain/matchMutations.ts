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
  if (kind === 'setup') return '准备'
  if (kind === 'end') return '终局'
  if (kind === 'night') return index <= 1 ? '第一夜' : `第${index}夜`
  return `第${index}昼`
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

export function setScript(match: Match, script: ScriptSnapshot): Match {
  return touchMatch({ ...match, script })
}
