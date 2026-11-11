import type { Match, MatchView } from './types'

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
