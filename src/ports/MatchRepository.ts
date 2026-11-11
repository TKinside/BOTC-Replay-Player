import type { Match } from '@/domain'

/** Persistence port — UI must not talk to IndexedDB directly. */
export interface MatchRepository {
  listMatches(): Promise<Match[]>
  getMatch(id: string): Promise<Match | undefined>
  saveMatch(match: Match): Promise<void>
  deleteMatch(id: string): Promise<void>
}
