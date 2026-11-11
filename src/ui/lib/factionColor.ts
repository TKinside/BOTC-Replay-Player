import type { FactionId } from '@/domain'

export const FACTION_LABEL: Record<FactionId, string> = {
  townsfolk: '镇民',
  outsider: '外来者',
  minion: '爪牙',
  demon: '恶魔',
  traveler: '旅人',
  fabled: '传奇',
  loric: 'Loric',
  unknown: '未知',
}

export const FACTION_COLOR: Record<FactionId, string> = {
  townsfolk: '#5b9bd5',
  outsider: '#38bdf8',
  minion: '#f97316',
  demon: '#ef4444',
  traveler: '#c084fc',
  fabled: '#eab308',
  loric: '#14b8a6',
  unknown: '#64748b',
}
