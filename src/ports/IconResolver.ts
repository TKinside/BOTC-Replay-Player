import type { FactionId } from '@/domain'

export interface IconResolveResult {
  kind: 'placeholder' | 'url' | 'asset'
  /** CSS color token or image URL / asset path. */
  value: string
  faction?: FactionId
}

/** roleId → icon. MVP: placeholders by faction. */
export interface IconResolver {
  resolve(roleId: string, faction?: FactionId): IconResolveResult
}
