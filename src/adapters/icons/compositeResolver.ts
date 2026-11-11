import type { FactionId } from '@/domain'
import type { IconResolver, IconResolveResult } from '@/ports'
import { PlaceholderIconResolver } from './placeholderResolver'
import { roleIconAssetUrl, roleIconCandidates } from './paths'

export interface CompositeIconOptions {
  /**
   * Prefer Script JSON `image` URLs.
   * Default: **true** (product UX — imported script icons should show).
   * Set false to force local pack / placeholder only.
   */
  allowRemoteImages?: boolean
  /** Vite/public base URL. */
  baseUrl?: string
}

/**
 * Icon pipeline (UI walks candidates; load errors fall through):
 * 1. Script JSON `image` URL when allowRemoteImages (default on)
 * 2. local pack under `public/icons/roles/{id}.webp|png|…`
 * 3. faction-color placeholder
 */
export class CompositeIconResolver implements IconResolver {
  private readonly placeholder = new PlaceholderIconResolver()
  private readonly allowRemoteImages: boolean
  private readonly baseUrl: string

  constructor(options: CompositeIconOptions = {}) {
    this.allowRemoteImages = options.allowRemoteImages ?? true
    this.baseUrl = options.baseUrl ?? import.meta.env.BASE_URL ?? '/'
  }

  resolve(
    roleId: string,
    faction: FactionId = 'unknown',
    imageUrl?: string,
  ): IconResolveResult {
    if (this.allowRemoteImages && imageUrl?.trim()) {
      return { kind: 'url', value: imageUrl.trim(), faction }
    }

    if (roleId) {
      return {
        kind: 'asset',
        value: roleIconAssetUrl(roleId, 'webp', this.baseUrl),
        faction,
      }
    }

    return this.placeholder.resolve(roleId, faction)
  }

  /**
   * Ordered image URLs to try before the faction placeholder.
   * Remote (if allowed) → local pack extensions.
   */
  candidates(
    roleId: string,
    imageUrl?: string,
  ): string[] {
    const list: string[] = []
    if (this.allowRemoteImages && imageUrl?.trim()) {
      list.push(imageUrl.trim())
    }
    if (roleId) {
      list.push(...roleIconCandidates(roleId, this.baseUrl))
    }
    return [...new Set(list)]
  }

  placeholderFor(faction: FactionId = 'unknown'): IconResolveResult {
    return this.placeholder.resolve('', faction)
  }
}

export const compositeIconResolver = new CompositeIconResolver()
