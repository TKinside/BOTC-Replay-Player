import { describe, expect, it } from 'vitest'
import { roleIconAssetUrl, roleIconCandidates } from './paths'

describe('role icon paths', () => {
  it('builds pack URLs under public/icons/roles without DOM', () => {
    expect(typeof document).toBe('undefined')
    expect(roleIconAssetUrl('washerwoman', 'webp', '/')).toBe(
      '/icons/roles/washerwoman.webp',
    )
    expect(roleIconAssetUrl('imp', 'png', '/BOTC-Replay-Player/')).toBe(
      '/BOTC-Replay-Player/icons/roles/imp.png',
    )
    expect(roleIconCandidates('chef', '/')).toEqual([
      '/icons/roles/chef.webp',
      '/icons/roles/chef.png',
      '/icons/roles/chef.svg',
      '/icons/roles/chef.jpg',
    ])
  })
})
