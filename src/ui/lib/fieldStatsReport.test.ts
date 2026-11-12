import { describe, expect, it } from 'vitest'
import type { Match } from '@/domain'
import {
  buildFieldStatsReport,
  goodCampNames,
  townsfolkNames,
} from './fieldStatsReport'

function sampleMatch(): Match {
  return {
    schemaVersion: 1,
    id: 'm1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    script: {
      origin: { kind: 'official-library', editionId: 'tb' },
      id: 'tb',
      name: '暗流涌动',
      roles: [
        { id: 'washerwoman', name: '洗衣妇', faction: 'townsfolk', source: 'official' },
        { id: 'imp', name: '小恶魔', faction: 'demon', source: 'official' },
        { id: 'poisoner', name: '投毒者', faction: 'minion', source: 'official' },
      ],
    },
    settings: {
      showPrepPhase: false,
      showSeatNumbers: true,
      allowAliases: false,
    },
    players: [
      { id: 'p1', seatIndex: 0, name: '阿徒', roleId: 'washerwoman' },
      { id: 'p2', seatIndex: 1, name: '小果', roleId: 'imp' },
      { id: 'p3', seatIndex: 2, name: '夜枭', roleId: 'poisoner' },
      { id: 'p4', seatIndex: 3, name: '未定' },
    ],
    phases: [{ id: 'n1', kind: 'night', index: 1, label: '第 1 夜' }],
    events: [],
    perspective: 'storyteller-omniscient',
  }
}

describe('fieldStatsReport', () => {
  it('lists townsfolk / good camp by assigned roles', () => {
    const match = sampleMatch()
    expect(townsfolkNames(match)).toEqual(['阿徒'])
    expect(goodCampNames(match)).toEqual(['阿徒'])
  })

  it('buildFieldStatsReport summarizes seats and factions', () => {
    const report = buildFieldStatsReport(sampleMatch())
    expect(report).toContain('场上 4 人')
    expect(report).toContain('已指派 3')
    expect(report).toContain('镇民（1）：阿徒')
    expect(report).toContain('爪牙（1）：夜枭')
    expect(report).toContain('恶魔（1）：小果')
  })
})
