import { describe, expect, it } from 'vitest'
import { CompositeIconResolver } from './compositeResolver'

describe('CompositeIconResolver', () => {
  it('allows remote Script JSON images by default', () => {
    expect(typeof document).toBe('undefined')
    const resolver = new CompositeIconResolver({ baseUrl: '/' })
    const remote = resolver.resolve(
      'coffeebean',
      'townsfolk',
      'https://example.com/coffee.png',
    )
    expect(remote).toEqual({
      kind: 'url',
      value: 'https://example.com/coffee.png',
      faction: 'townsfolk',
    })
  })

  it('candidates prefer remote then local pack paths', () => {
    const resolver = new CompositeIconResolver({ baseUrl: '/' })
    expect(
      resolver.candidates('imp', 'https://cdn.example/imp.webp'),
    ).toEqual([
      'https://cdn.example/imp.webp',
      '/icons/roles/imp.webp',
      '/icons/roles/imp.png',
      '/icons/roles/imp.svg',
      '/icons/roles/imp.jpg',
    ])
  })

  it('can disable remote images and fall back to local pack', () => {
    const resolver = new CompositeIconResolver({
      allowRemoteImages: false,
      baseUrl: '/',
    })
    const result = resolver.resolve(
      'washerwoman',
      'townsfolk',
      'https://example.com/ww.png',
    )
    expect(result.kind).toBe('asset')
    expect(result.value).toBe('/icons/roles/washerwoman.webp')
    expect(resolver.candidates('washerwoman', 'https://example.com/ww.png')).toEqual([
      '/icons/roles/washerwoman.webp',
      '/icons/roles/washerwoman.png',
      '/icons/roles/washerwoman.svg',
      '/icons/roles/washerwoman.jpg',
    ])
  })
})
