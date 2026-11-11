import { describe, expect, it } from 'vitest'
import { appendEvent, reduceMatch, reducePlayerStatuses } from './reduce'
import { addPlayer, advancePhase, assignRole } from './matchMutations'
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

  it('reducePlayerStatuses applies poison/death patches', () => {
    const statuses = reducePlayerStatuses([
      {
        id: 'e1',
        typeId: 'poison',
        phaseId: 'night-1',
        at: '2026-01-01T01:00:00.000Z',
        payload: {},
        statusApply: [{ playerId: 'p1', statusId: 'poisoned', op: 'add' }],
      },
      {
        id: 'e2',
        typeId: 'death',
        phaseId: 'night-1',
        at: '2026-01-01T01:01:00.000Z',
        payload: {},
        statusApply: [{ playerId: 'p1', statusId: 'dead', op: 'add' }],
      },
    ])
    expect(statuses).toEqual([
      { playerId: 'p1', statuses: ['poisoned', 'dead'] },
    ])
  })
})

describe('domain/matchMutations', () => {
  it('adds players, assigns roles, advances night→day→night', () => {
    let match = emptyMatch()
    match = { ...match, players: [], phases: [{ id: 'setup', kind: 'setup', index: 0 }] }
    match = addPlayer(match, '徒')
    match = assignRole(match, match.players[0]!.id, 'washerwoman')
    expect(match.players[0]?.roleId).toBe('washerwoman')

    match = advancePhase(match)
    expect(match.phases.at(-1)).toMatchObject({ kind: 'night', index: 1 })
    match = advancePhase(match)
    expect(match.phases.at(-1)).toMatchObject({ kind: 'day', index: 1 })
    match = advancePhase(match)
    expect(match.phases.at(-1)).toMatchObject({ kind: 'night', index: 2 })
  })
})
