import type { FactionId } from '@/domain'
import type { IconResolver, IconResolveResult } from '@/ports'

const FACTION_COLORS: Record<FactionId, string> = {
  townsfolk: '#3b82f6',
  outsider: '#38bdf8',
  minion: '#f97316',
  demon: '#ef4444',
  traveler: '#a855f7',
  fabled: '#eab308',
  loric: '#14b8a6',
  unknown: '#64748b',
}

/** MVP IconResolver: solid color placeholders by faction. */
export class PlaceholderIconResolver implements IconResolver {
  resolve(_roleId: string, faction: FactionId = 'unknown'): IconResolveResult {
    return {
      kind: 'placeholder',
      value: FACTION_COLORS[faction] ?? FACTION_COLORS.unknown,
      faction,
    }
  }
}

export const placeholderIconResolver = new PlaceholderIconResolver()
