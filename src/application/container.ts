import { indexedDbMatchRepository } from '@/adapters/persistence'
import { htmlLongImageExporter } from '@/adapters/export'
import { MatchService } from './matchService'

let singleton: MatchService | undefined

/** App-wide MatchService wired to IndexedDB + long-image exporter. */
export function getMatchService(): MatchService {
  if (!singleton) {
    singleton = new MatchService(
      indexedDbMatchRepository,
      htmlLongImageExporter,
    )
  }
  return singleton
}
