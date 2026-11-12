import type { GameEvent, Match, MatchView, StatusPatch } from './types'

export interface PlayerStatusView {
  playerId: string
  statuses: string[]
}

export interface RichMatchView extends MatchView {
  playerStatuses: PlayerStatusView[]
  scriptName: string
}

/**
 * Derive a MatchView from a Match document.
 * Pure domain function — no DOM / browser APIs.
 */
export function reduceMatch(match: Match): MatchView {
  const lastPhase = match.phases[match.phases.length - 1]
  return {
    matchId: match.id,
    playerCount: match.players.length,
    eventCount: match.events.length,
    currentPhase: lastPhase,
    winner: match.outcome?.winner,
  }
}

/** Apply status patches onto a mutable map of playerId → status set. */
export function applyStatusPatches(
  map: Map<string, Set<string>>,
  patches: StatusPatch[] | undefined,
): void {
  if (!patches) return
  for (const patch of patches) {
    let set = map.get(patch.playerId)
    if (!set) {
      set = new Set()
      map.set(patch.playerId, set)
    }
    if (patch.op === 'add') set.add(patch.statusId)
    else if (patch.op === 'remove') set.delete(patch.statusId)
    else if (patch.op === 'replace') {
      set.clear()
      set.add(patch.statusId)
    }
  }
}

/** Reduce events into per-player status tags. */
export function reducePlayerStatuses(events: GameEvent[]): PlayerStatusView[] {
  const map = new Map<string, Set<string>>()
  for (const event of events) {
    applyStatusPatches(map, event.statusApply)
  }
  return [...map.entries()].map(([playerId, statuses]) => ({
    playerId,
    statuses: [...statuses],
  }))
}

export function reduceRichMatch(match: Match): RichMatchView {
  return {
    ...reduceMatch(match),
    playerStatuses: reducePlayerStatuses(match.events),
    scriptName: match.script.name,
  }
}

/** Append-only: return a new Match with one more event. */
export function appendEvent(
  match: Match,
  event: Match['events'][number],
): Match {
  return {
    ...match,
    updatedAt: event.at,
    events: [...match.events, event],
  }
}

/** Remove one event by id (no-op if missing). Status views re-reduce from the rest. */
export function removeEvent(match: Match, eventId: string): Match {
  if (!match.events.some((e) => e.id === eventId)) return match
  return touchMatch({
    ...match,
    events: match.events.filter((e) => e.id !== eventId),
  })
}

export function touchMatch(match: Match, at = new Date().toISOString()): Match {
  return { ...match, updatedAt: at }
}
