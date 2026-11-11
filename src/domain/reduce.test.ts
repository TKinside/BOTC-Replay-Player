import { describe, expect, it } from 'vitest'
import { appendEvent, reduceMatch } from './reduce'
import type { Match } from './types'

function emptyMatch(): Match {
  return {
    schemaVersion: 1,
    id: 'match-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    script: {
      origin: { kind: 'official-library', editionId: 'tb' },
      id: 'tb',
      name: '暗流涌动',
      roles: [],
    },
    settings: {
      showPrepPhase: false,
      showSeatNumbers: true,
      allowAliases: false,
    },
    players: [
      { id: 'p1', seatIndex: 0, name: 'Alice' },
      { id: 'p2', seatIndex: 1, name: 'Bob' },
    ],
    phases: [{ id: 'night-1', kind: 'night', index: 1, label: '第一夜' }],
    events: [],
    perspective: 'storyteller-omniscient',
  }
}

describe('domain/reduceMatch', () => {
  it('derives MatchView without needing DOM', () => {
    // Smoke: prove domain runs in node (vitest environment: node).
    expect(typeof document).toBe('undefined')

    const match = emptyMatch()
    const view = reduceMatch(match)

    expect(view.matchId).toBe('match-1')
    expect(view.playerCount).toBe(2)
    expect(view.eventCount).toBe(0)
    expect(view.currentPhase?.kind).toBe('night')
  })

  it('appendEvent is append-only and updates counts via reduce', () => {
    const match = emptyMatch()
    const next = appendEvent(match, {
      id: 'evt-1',
      typeId: 'custom',
      phaseId: 'night-1',
      at: '2026-01-01T01:00:00.000Z',
      payload: {},
      text: '占位事件',
    })

    expect(match.events).toHaveLength(0)
    expect(reduceMatch(next).eventCount).toBe(1)
  })
})
