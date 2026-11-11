import type { FactionId } from '@/domain'
import type { IconResolver, IconResolveResult } from '@/ports'
import { PlaceholderIconResolver } from './placeholderResolver'
import { roleIconAssetUrl } from './paths'

export interface CompositeIconOptions {
  /** Prefer Script JSON `image` URLs (off by default — tracking/CORS). */
  allowRemoteImages?: boolean
  /** Vite/public base URL. */
  baseUrl?: string
}

/**
 * Icon pipeline:
 * 1. optional remote `imageUrl` (opt-in)
 * 2. local official pack under `public/icons/roles/{id}.webp|png|…`
 * 3. faction-color placeholder
 *
 * UI should attempt `asset`/`url` and fall back to placeholder on load error.
 */
export class CompositeIconResolver implements IconResolver {
  private readonly placeholder = new PlaceholderIconResolver()

  constructor(private readonly options: CompositeIconOptions = {}) {}

  resolve(
    roleId: string,
    faction: FactionId = 'unknown',
    imageUrl?: string,
  ): IconResolveResult {
    if (this.options.allowRemoteImages && imageUrl?.trim()) {
      return { kind: 'url', value: imageUrl.trim(), faction }
    }

    if (roleId) {
      return {
        kind: 'asset',
        // Preferred extension; RoleIcon will try the full candidate list.
        value: roleIconAssetUrl(
          roleId,
          'webp',
          this.options.baseUrl ?? import.meta.env.BASE_URL ?? '/',
        ),
        faction,
      }
    }

    return this.placeholder.resolve(roleId, faction)
  }

  placeholderFor(faction: FactionId = 'unknown'): IconResolveResult {
    return this.placeholder.resolve('', faction)
  }
}

export const compositeIconResolver = new CompositeIconResolver()
