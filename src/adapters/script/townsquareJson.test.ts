import { describe, expect, it } from 'vitest'
import {
  cleanRoleId,
  mapTeamToFaction,
  parseTownsquareScript,
  parseTownsquareScriptText,
} from './townsquareJson'
import type { RoleDef } from '@/domain'

const stubOfficial: RoleDef[] = [
  {
    id: 'washerwoman',
    name: '洗衣妇',
    faction: 'townsfolk',
    ability: '官方洗衣妇能力',
    source: 'official',
  },
  {
    id: 'imp',
    name: '小恶魔',
    faction: 'demon',
    ability: '官方小恶魔能力',
    source: 'official',
  },
]

function resolveOfficial(id: string): RoleDef | undefined {
  return stubOfficial.find((r) => r.id === id)
}

describe('TownsquareScriptAdapter', () => {
  it('runs without DOM', () => {
    expect(typeof document).toBe('undefined')
  })

  it('cleans role ids like townsquare', () => {
    expect(cleanRoleId('Washer-Woman')).toBe('washerwoman')
    expect(cleanRoleId('Scarlet Woman!')).toBe('scarletwoman')
  })

  it('normalizes traveller spelling to traveler', () => {
    expect(mapTeamToFaction('traveller')).toBe('traveler')
    expect(mapTeamToFaction('traveler')).toBe('traveler')
  })

  it('rejects non-array top level', () => {
    const result = parseTownsquareScript({ id: 'tb' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toMatch(/数组/)
  })

  it('parses _meta + string ids and merges official definitions', () => {
    const result = parseTownsquareScript(
      [
        { id: '_meta', name: '暗流涌动', author: 'TPI' },
        'washerwoman',
        'imp',
      ],
      { resolveOfficial },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.snapshot.name).toBe('暗流涌动')
    expect(result.snapshot.author).toBe('TPI')
    expect(result.snapshot.origin.kind).toBe('townsquare-json')
    const ww = result.snapshot.roles.find((r) => r.id === 'washerwoman')
    expect(ww?.name).toBe('洗衣妇')
    expect(ww?.ability).toBe('官方洗衣妇能力')
    expect(ww?.faction).toBe('townsfolk')
  })

  it('keeps custom roles from full objects', () => {
    const result = parseTownsquareScript(
      [
        { id: '_meta', name: '自制本' },
        {
          id: 'coffeebean',
          name: '咖啡豆',
          team: 'townsfolk',
          ability: '每个夜晚喝一口咖啡。',
          image: 'https://example.com/coffee.png',
        },
        'imp',
      ],
      { resolveOfficial },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const custom = result.snapshot.roles.find((r) => r.id === 'coffeebean')
    expect(custom).toMatchObject({
      name: '咖啡豆',
      faction: 'townsfolk',
      ability: '每个夜晚喝一口咖啡。',
      imageUrl: 'https://example.com/coffee.png',
      source: 'script-json',
    })
    expect(result.snapshot.roles.find((r) => r.id === 'imp')?.name).toBe(
      '小恶魔',
    )
  })

  it('accepts traveller team on custom roles', () => {
    const result = parseTownsquareScript(
      [
        {
          id: 'wanderer',
          name: '游荡者',
          team: 'traveller',
          ability: '旅人占位。',
        },
      ],
      { resolveOfficial },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.snapshot.roles[0]?.faction).toBe('traveler')
  })

  it('parseText handles invalid JSON', () => {
    const result = parseTownsquareScriptText('{nope')
    expect(result.ok).toBe(false)
  })
})
