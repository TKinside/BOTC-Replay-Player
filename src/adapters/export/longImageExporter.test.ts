import { describe, expect, it } from 'vitest'
import { buildExportLines } from './longImageExporter'
import type { Match } from '@/domain'

function sampleMatch(): Match {
  return {
    schemaVersion: 1,
    id: 'match-export',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T01:00:00.000Z',
    script: {
      origin: { kind: 'official-library', editionId: 'tb' },
      id: 'tb',
      name: '暗流涌动',
      roles: [
        {
          id: 'washerwoman',
          name: '洗衣妇',
          faction: 'townsfolk',
          source: 'official',
        },
      ],
    },
    settings: {
      showPrepPhase: false,
      showSeatNumbers: true,
      allowAliases: false,
    },
    players: [
      { id: 'p1', seatIndex: 0, name: '阿徒', roleId: 'washerwoman' },
      { id: 'p2', seatIndex: 1, name: '小果' },
    ],
    phases: [
      { id: 'setup', kind: 'setup', index: 0, label: '准备' },
      { id: 'night-1', kind: 'night', index: 1, label: '第一夜' },
    ],
    events: [
      {
        id: 'e1',
        typeId: 'death',
        phaseId: 'setup',
        at: '2026-01-01T00:30:00.000Z',
        payload: {},
        text: '阿徒 死亡',
      },
    ],
    perspective: 'storyteller-omniscient',
  }
}

describe('buildExportLines', () => {
  it('includes brand, real nicknames, roles, and event text (no mask)', () => {
    const lines = buildExportLines(sampleMatch()).map((l) => l.text)
    expect(lines).toContain('《血染钟楼复盘器》')
    expect(lines).toContain('暗流涌动')
    expect(lines).toContain('1. 阿徒 · 洗衣妇')
    expect(lines).toContain('2. 小果')
    expect(lines).toContain('阿徒 死亡')
    expect(lines).toContain('昵称原样导出 · 无打码')
    expect(lines.some((t) => t.includes('匿名'))).toBe(false)
  })
})
