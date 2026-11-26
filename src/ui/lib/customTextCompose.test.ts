import { describe, expect, it } from 'vitest'
import type { RoleDef } from '@/domain'
import {
  activeMentionAt,
  composeCustomTextLog,
  filterRolesForMention,
  insertMention,
  parseRoleMentions,
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
