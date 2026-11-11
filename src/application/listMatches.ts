import type { Match } from '@/domain'
import type { MatchRepository } from '@/ports'

/** Application use-case: list locally saved matches. */
export async function listMatches(repo: MatchRepository): Promise<Match[]> {
  return repo.listMatches()
}
