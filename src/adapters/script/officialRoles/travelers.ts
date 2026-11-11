import type { RoleDef } from '@/domain'

/** Common travelers often paired with TB tables — catalog only, not forced into seats. */
export const TRAVELER_ROLES: RoleDef[] = [
  {
    id: 'bureaucrat',
    name: '官僚',
    faction: 'traveler',
    ability: '每个夜晚，选择至多三对玩家：交换他们的座位。',
    source: 'official',
    iconKey: 'bureaucrat',
  },
  {
    id: 'thief',
    name: '盗贼',
    faction: 'traveler',
    ability:
      '每个夜晚，选择一名相邻玩家：交换你们的角色与阵营。如果你死亡，能力失效。',
    source: 'official',
    iconKey: 'thief',
  },
  {
    id: 'gunslinger',
    name: '枪手',
    faction: 'traveler',
    ability: '每个白天，当投票产生平票时，你选择谁被提名处决。',
    source: 'official',
    iconKey: 'gunslinger',
  },
  {
    id: 'scapegoat',
    name: '替罪羊',
    faction: 'traveler',
    ability:
      '如果你被处决，立即再进行一次提名与处决（你可能再次被处决）。',
    source: 'official',
    iconKey: 'scapegoat',
  },
  {
    id: 'beggar',
    name: '乞丐',
    faction: 'traveler',
    ability:
      '你只能投票赞成处决。如果你死亡，所有投票赞成处决你的玩家可能死亡。',
    source: 'official',
    iconKey: 'beggar',
  },
]
