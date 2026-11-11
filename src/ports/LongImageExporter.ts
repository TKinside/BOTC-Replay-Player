import type { Match } from '@/domain'

/**
 * Long-image export port.
 * Nicknames are exported as-is (no anonymize / mask).
 */
export interface LongImageExporter {
  exportMatch(match: Match): Promise<Blob>
}
