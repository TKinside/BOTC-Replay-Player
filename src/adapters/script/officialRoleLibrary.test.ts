import { describe, expect, it } from 'vitest'
import { officialRoleLibrary } from './officialRoleLibrary'

describe('OfficialRoleLibrary', () => {
  it('seeds full Trouble Brewing cast without DOM', () => {
    expect(typeof document).toBe('undefined')
    const snapshot = officialRoleLibrary.buildTroubleBrewingSnapshot()
    expect(snapshot.name).toBe('暗流涌动')
    expect(snapshot.roles.length).toBeGreaterThanOrEqual(22)
    expect(snapshot.roles.some((r) => r.id === 'washerwoman')).toBe(true)
    expect(snapshot.roles.some((r) => r.id === 'imp')).toBe(true)
    expect(snapshot.roles.every((r) => r.source === 'official')).toBe(true)
  })

  it('keeps travelers in catalog but not forced into TB snapshot seats', () => {
    const snapshot = officialRoleLibrary.buildTroubleBrewingSnapshot()
    expect(snapshot.roles.some((r) => r.faction === 'traveler')).toBe(false)
    expect(officialRoleLibrary.getRoleSync('gunslinger')?.name).toBe('枪手')
    expect(officialRoleLibrary.listEditions()[0]?.id).toBe('tb')
  })
})
