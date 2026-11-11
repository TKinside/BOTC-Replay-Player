import type { FactionId } from '@/domain'

export interface IconResolveResult {
  kind: 'placeholder' | 'url' | 'asset'
  /** CSS color (placeholder) or image URL / asset path. */
  value: string
  faction?: FactionId
}

/**
 * roleId → icon.
 * Pipeline: optional remote image → local `public/icons/roles` pack → placeholder.
 */
export interface IconResolver {
  resolve(
    roleId: string,
    faction?: FactionId,
    imageUrl?: string,
  ): IconResolveResult
}
