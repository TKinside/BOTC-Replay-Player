import type { FactionId } from '@/domain'

/** townsquare `clean`: lowercase + strip non [a-z0-9]. */
export function cleanRoleId(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function mapTeamToFaction(team: unknown): FactionId {
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
