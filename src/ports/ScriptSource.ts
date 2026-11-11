import type { ScriptSnapshot } from '@/domain'

/**
 * Provides a frozen script snapshot for one match.
 * Implementations: townsquare JSON import, official library manual build.
 */
export interface ScriptSource {
  load(): Promise<ScriptSnapshot>
}
