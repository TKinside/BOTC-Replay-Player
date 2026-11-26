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

export type MoveEventDirection = 'up' | 'down'

/**
 * Reorder one event within its phase, or move it into the adjacent phase when
 * it is already first/last in the current phase. No-op at absolute top/bottom
 * of the whole log, or when the event id is unknown.
 */
export function moveEvent(
  match: Match,
  eventId: string,
  direction: MoveEventDirection,
): Match {
  const buckets = match.phases.map((phase) => ({
    phaseId: phase.id,
    events: match.events.filter((e) => e.phaseId === phase.id),
  }))

  let phaseIdx = -1
  let eventIdx = -1
  for (let i = 0; i < buckets.length; i += 1) {
    const j = buckets[i]!.events.findIndex((e) => e.id === eventId)
    if (j >= 0) {
      phaseIdx = i
      eventIdx = j
      break
    }
  }
  if (phaseIdx < 0 || eventIdx < 0) return match

  const bucket = buckets[phaseIdx]!
  const event = bucket.events[eventIdx]!

  if (direction === 'up') {
    if (eventIdx > 0) {
      const arr = bucket.events
      ;[arr[eventIdx - 1], arr[eventIdx]] = [arr[eventIdx]!, arr[eventIdx - 1]!]
    } else if (phaseIdx > 0) {
      bucket.events.splice(eventIdx, 1)
      const prev = buckets[phaseIdx - 1]!
      prev.events.push({ ...event, phaseId: prev.phaseId })
    } else {
      return match
    }
  } else if (eventIdx < bucket.events.length - 1) {
    const arr = bucket.events
    ;[arr[eventIdx], arr[eventIdx + 1]] = [arr[eventIdx + 1]!, arr[eventIdx]!]
  } else if (phaseIdx < buckets.length - 1) {
    bucket.events.splice(eventIdx, 1)
    const next = buckets[phaseIdx + 1]!
    next.events.unshift({ ...event, phaseId: next.phaseId })
  } else {
    return match
  }

  const known = new Set<string>()
  const events: GameEvent[] = []
  for (const b of buckets) {
    for (const e of b.events) {
      events.push(e)
      known.add(e.id)
    }
  }
  for (const e of match.events) {
    if (!known.has(e.id)) events.push(e)
  }

  return touchMatch({ ...match, events })
}

/** Whether the event can move up/down in the phase-ordered log. */
export function canMoveEvent(
  match: Match,
  eventId: string,
  direction: MoveEventDirection,
): boolean {
  let phaseIdx = -1
  let eventIdx = -1
  let phaseLen = 0
  for (let i = 0; i < match.phases.length; i += 1) {
    const phaseId = match.phases[i]!.id
    const inPhase = match.events.filter((e) => e.phaseId === phaseId)
    const j = inPhase.findIndex((e) => e.id === eventId)
    if (j >= 0) {
      phaseIdx = i
      eventIdx = j
      phaseLen = inPhase.length
      break
    }
  }
  if (phaseIdx < 0) return false
  if (direction === 'up') {
    return eventIdx > 0 || phaseIdx > 0
  }
  return eventIdx < phaseLen - 1 || phaseIdx < match.phases.length - 1
}

export function touchMatch(match: Match, at = new Date().toISOString()): Match {
  return { ...match, updatedAt: at }
}
