import type { Match } from '@/domain'
import type { LongImageExporter } from '@/ports'

/**
 * Long-image export stub.
 * Real implementation will render a dedicated export view then capture
 * (html-to-image / modern-screenshot). Nicknames stay unmasked.
 */
export class StubLongImageExporter implements LongImageExporter {
  async exportMatch(match: Match): Promise<Blob> {
    const summary = [
      '《血染钟楼复盘器》长图导出 stub',
      `matchId=${match.id}`,
      `script=${match.script.name}`,
      `players=${match.players.map((p) => p.name).join(', ')}`,
      '（昵称原样保留，无打码）',
    ].join('\n')

    return new Blob([summary], { type: 'text/plain;charset=utf-8' })
  }
}

export const stubLongImageExporter = new StubLongImageExporter()
