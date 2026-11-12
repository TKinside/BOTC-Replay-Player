import type { FactionId, Match } from '@/domain'
import { FACTION_LABEL } from './factionColor'

const GOOD: FactionId[] = ['townsfolk', 'outsider']
const EVIL: FactionId[] = ['minion', 'demon']

function roleFaction(match: Match, playerId: string): FactionId | undefined {
  const player = match.players.find((p) => p.id === playerId)
  if (!player?.roleId) return undefined
  return match.script.roles.find((r) => r.id === player.roleId)?.faction
}

function namesForFactions(match: Match, factions: FactionId[]): string[] {
  return match.players
    .slice()
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .filter((p) => {
      const f = roleFaction(match, p.id)
      return f != null && factions.includes(f)
    })
    .map((p) => p.name)
}

/** Mini-program-style on-table stats blurb for log insertion. */
export function buildFieldStatsReport(match: Match): string {
  const total = match.players.length
  if (total === 0) return '场上尚无玩家。'

  const assigned = match.players.filter((p) => p.roleId).length
  const lines: string[] = [
    `场上 ${total} 人，已指派 ${assigned}，未指派 ${total - assigned}。`,
  ]

  for (const faction of [
    'townsfolk',
    'outsider',
    'minion',
    'demon',
  ] as FactionId[]) {
    const names = namesForFactions(match, [faction])
    if (names.length === 0) continue
    lines.push(
      `${FACTION_LABEL[faction]}（${names.length}）：${names.join('、')}。`,
    )
  }

  const travelers = namesForFactions(match, ['traveler'])
  if (travelers.length > 0) {
    lines.push(`旅人（${travelers.length}）：${travelers.join('、')}。`)
  }

  return lines.join('')
}

export function townsfolkNames(match: Match): string[] {
  return namesForFactions(match, ['townsfolk'])
}

export function minionNames(match: Match): string[] {
  return namesForFactions(match, ['minion'])
}

export function goodCampNames(match: Match): string[] {
  return namesForFactions(match, GOOD)
}

export function evilCampNames(match: Match): string[] {
  return namesForFactions(match, EVIL)
}

export function allPlayerNames(match: Match): string[] {
  return match.players
    .slice()
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .map((p) => p.name)
}
