import { describe, expect, it } from 'vitest'
import type { RoleDef } from '@/domain'
import type { Player } from '@/domain'
import {
  activeMentionAt,
  canBareMatchPlayerName,
  composeCustomTextLog,
  expandLogTextPlain,
  filterRolesForMention,
  insertMention,
  parseLogText,
  parseRoleMentions,
  playerMentionToken,
} from './customTextCompose'

const roles: RoleDef[] = [
  {
    id: 'widow',
    name: '寡妇',
    faction: 'minion',
    source: 'official',
  },
  {
    id: 'washerwoman',
    name: '洗衣妇',
    faction: 'townsfolk',
    source: 'official',
  },
  {
    id: 'washerwoman_alt',
    name: '洗衣',
    faction: 'townsfolk',
    source: 'user',
  },
]

describe('composeCustomTextLog', () => {
  it('builds actor + action + target with empty free text', () => {
    expect(
      composeCustomTextLog({
        actorName: 'A',
        actionId: 'choose',
        targetNames: ['B'],
        text: '',
      }),
    ).toBe('A选择B')
  })

  it('appends free text after actor + action when target is none', () => {
    expect(
      composeCustomTextLog({
        actorName: 'A',
        actionId: 'learn',
        targetNames: [''],
        text: '寡妇在场',
      }),
    ).toBe('A得知寡妇在场')
  })

  it('uses only free text when actor and targets are none', () => {
    expect(
      composeCustomTextLog({
        actorName: '',
        actionId: 'learn',
        targetNames: [],
        text: '仅备注',
      }),
    ).toBe('仅备注')
  })

  it('joins multiple targets with顿号', () => {
    expect(
      composeCustomTextLog({
        actorName: 'A',
        actionId: 'choose',
        targetNames: ['B', 'C'],
        text: '',
      }),
    ).toBe('A选择B、C')
  })

  it('ignores empty action id', () => {
    expect(
      composeCustomTextLog({
        actorName: 'A',
        actionId: '',
        targetNames: ['B'],
        text: '备注',
      }),
    ).toBe('AB备注')
  })
})

describe('parseRoleMentions', () => {
  it('splits @role into mention with icon-ready role', () => {
    expect(parseRoleMentions('得知@寡妇在场', roles)).toEqual([
      { kind: 'text', value: '得知' },
      { kind: 'mention', role: roles[0], raw: '@寡妇' },
      { kind: 'text', value: '在场' },
    ])
  })

  it('prefers the longest matching role name', () => {
    const segs = parseRoleMentions('@洗衣妇来了', roles)
    expect(segs).toEqual([
      { kind: 'mention', role: roles[1], raw: '@洗衣妇' },
      { kind: 'text', value: '来了' },
    ])
  })

  it('leaves unmatched @ as plain text', () => {
    expect(parseRoleMentions('有@未知角色', roles)).toEqual([
      { kind: 'text', value: '有@未知角色' },
    ])
  })
})

describe('mention helpers', () => {
  it('detects active @query at cursor', () => {
    expect(activeMentionAt('得知@寡', 4)).toEqual({ start: 2, query: '寡' })
    expect(activeMentionAt('得知 寡妇', 5)).toBeNull()
  })

  it('does not treat @# player tokens as role autocomplete', () => {
    expect(activeMentionAt(`选${playerMentionToken('player-1')}`, 12)).toBeNull()
  })

  it('inserts mention replacing the active query', () => {
    expect(insertMention('得知@寡', 4, '寡妇')).toEqual({
      value: '得知@寡妇',
      cursor: 5,
    })
  })

  it('filters roles for autocomplete', () => {
    expect(filterRolesForMention(roles, '寡').map((r) => r.id)).toEqual([
      'widow',
    ])
  })
})

const players: Player[] = [
  { id: 'player-a', seatIndex: 0, name: '爱丽丝', roleId: 'washerwoman' },
  { id: 'player-b', seatIndex: 1, name: '鲍勃', roleId: 'widow' },
  { id: 'player-c', seatIndex: 2, name: '卡罗' },
]

describe('parseLogText players', () => {
  it('expands @#playerId to player+role when assigned', () => {
    const text = `${playerMentionToken('player-a')}选择${playerMentionToken('player-b')}`
    const segs = parseLogText(text, { roles, players })
    expect(segs).toEqual([
      {
        kind: 'player',
        player: players[0],
        role: roles[1],
        raw: playerMentionToken('player-a'),
      },
      { kind: 'text', value: '选择' },
      {
        kind: 'player',
        player: players[1],
        role: roles[0],
        raw: playerMentionToken('player-b'),
      },
    ])
  })

  it('leaves unassigned players without a role', () => {
    const segs = parseLogText(playerMentionToken('player-c'), {
      roles,
      players,
    })
    expect(segs).toEqual([
      {
        kind: 'player',
        player: players[2],
        role: undefined,
        raw: playerMentionToken('player-c'),
      },
    ])
  })

  it('matches bare player names in free text', () => {
    const segs = parseLogText('爱丽丝选择鲍勃', { roles, players })
    expect(segs.map((s) => s.kind)).toEqual(['player', 'text', 'player'])
  })

  it('expands tokens to plain name(role) for export', () => {
    expect(
      expandLogTextPlain(
        `${playerMentionToken('player-a')}选择${playerMentionToken('player-c')}`,
        { roles, players },
      ),
    ).toBe('爱丽丝(洗衣妇)选择卡罗')
  })
})

describe('compose with player tokens', () => {
  it('embeds tokens for rich rendering', () => {
    expect(
      composeCustomTextLog({
        actorName: playerMentionToken('player-a'),
        actionId: 'choose',
        targetNames: [playerMentionToken('player-b')],
        text: '',
      }),
    ).toBe(
      `${playerMentionToken('player-a')}选择${playerMentionToken('player-b')}`,
    )
  })
})

describe('canBareMatchPlayerName', () => {
  it('rejects numeric-only nicknames that would collide in free text', () => {
    expect(canBareMatchPlayerName('1')).toBe(false)
    expect(canBareMatchPlayerName('222')).toBe(false)
    expect(canBareMatchPlayerName('爱丽丝')).toBe(true)
  })
})

describe('parseLogText numeric nicknames', () => {
  it('still resolves @# tokens for digit nicknames', () => {
    const digitPlayers: Player[] = [
      { id: 'p-1', seatIndex: 0, name: '1', roleId: 'washerwoman' },
      { id: 'p-222', seatIndex: 1, name: '222', roleId: 'widow' },
    ]
    const text = `${playerMentionToken('p-1')}提名了${playerMentionToken('p-222')}（5票）`
    const segs = parseLogText(text, { roles, players: digitPlayers })
    expect(segs.map((s) => s.kind)).toEqual([
      'player',
      'text',
      'player',
      'text',
    ])
    expect(expandLogTextPlain(text, { roles, players: digitPlayers })).toBe(
      '1(洗衣妇)提名了222(寡妇)（5票）',
    )
  })

  it('does not bare-match digit nicknames inside vote counts', () => {
    const digitPlayers: Player[] = [
      { id: 'p-1', seatIndex: 0, name: '1', roleId: 'washerwoman' },
    ]
    const segs = parseLogText('提名了某人（5票）', {
      roles,
      players: digitPlayers,
    })
    expect(segs).toEqual([{ kind: 'text', value: '提名了某人（5票）' }])
  })
})
