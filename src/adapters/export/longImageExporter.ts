import type { Match } from '@/domain'
import type { LongImageExporter } from '@/ports'

const WIDTH = 720
const PAD = 32
const FONT_STACK =
  '"Segoe UI","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif'

type DrawLine = {
  text: string
  size: number
  weight?: number | string
  color: string
  gapAfter: number
}

/**
 * Long-image export via Canvas 2D text (no SVG foreignObject).
 * Nicknames are exported as-is (no anonymize / mask).
 *
 * Note: drawing SVG+foreignObject into a canvas taints it in Chromium,
 * so `toBlob` fails with "Tainted canvases may not be exported."
 */
export class HtmlLongImageExporter implements LongImageExporter {
  async exportMatch(match: Match): Promise<Blob> {
    if (typeof document === 'undefined') {
      return new Blob(
        [`《血染钟楼复盘器》\n${match.script.name}\n${playerLines(match)}`],
        { type: 'text/plain;charset=utf-8' },
      )
    }

    const lines = buildExportLines(match)
    const canvas = renderLinesToCanvas(lines)
    return canvasToPngBlob(canvas)
  }
}

export function buildExportLines(match: Match): DrawLine[] {
  const lines: DrawLine[] = [
    {
      text: 'BOTC REPLAY',
      size: 12,
      color: '#9aabbc',
      gapAfter: 8,
    },
    {
      text: '《血染钟楼复盘器》',
      size: 28,
      weight: 600,
      color: '#e8eef4',
      gapAfter: 8,
    },
    {
      text: match.title
        ? `${match.script.name} · ${match.title}`
        : match.script.name,
      size: 16,
      color: '#e8eef4',
      gapAfter: 6,
    },
    {
      text: `${match.updatedAt} · ${match.players.length} 人`,
      size: 12,
      color: '#9aabbc',
      gapAfter: 20,
    },
    {
      text: '座位与昵称',
      size: 18,
      weight: 600,
      color: '#e8eef4',
      gapAfter: 10,
    },
  ]

  const players = match.players.slice().sort((a, b) => a.seatIndex - b.seatIndex)
  if (players.length === 0) {
    lines.push({
      text: '暂无玩家',
      size: 14,
      color: '#9aabbc',
      gapAfter: 8,
    })
  } else {
    for (const p of players) {
      const role = match.script.roles.find((r) => r.id === p.roleId)
      lines.push({
        text: `${p.seatIndex + 1}. ${p.name}${role ? ` · ${role.name}` : ''}`,
        size: 15,
        color: '#e8eef4',
        gapAfter: 6,
      })
    }
  }

  lines.push({ text: '', size: 8, color: '#e8eef4', gapAfter: 12 })

  for (const phase of match.phases) {
    const events = match.events.filter((e) => e.phaseId === phase.id)
    if (events.length === 0 && phase.kind === 'setup') continue

    lines.push({
      text: phase.label || phase.kind,
      size: 16,
      weight: 600,
      color: '#9aabbc',
      gapAfter: 8,
    })

    if (events.length === 0) {
      lines.push({
        text: '（无事件）',
        size: 13,
        color: '#9aabbc',
        gapAfter: 10,
      })
    } else {
      for (const event of events) {
        lines.push({
          text: event.text || event.typeId,
          size: 14,
          color: '#e8eef4',
          gapAfter: 8,
        })
      }
      lines.push({ text: '', size: 4, color: '#e8eef4', gapAfter: 8 })
    }
  }

  lines.push({
    text: '昵称原样导出 · 无打码',
    size: 12,
    color: '#9aabbc',
    gapAfter: 0,
  })

  return lines
}

function playerLines(match: Match): string {
  return match.players
    .map((p) => {
      const role = match.script.roles.find((r) => r.id === p.roleId)
      return `${p.seatIndex + 1}. ${p.name}${role ? ` · ${role.name}` : ''}`
    })
    .join('\n')
}

function renderLinesToCanvas(lines: DrawLine[]): HTMLCanvasElement {
  const scale = Math.min(2, window.devicePixelRatio || 1)
  const contentWidth = WIDTH - PAD * 2

  // Measure height with an offscreen context first.
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('Canvas 不可用')

  let height = PAD
  for (const line of lines) {
    if (!line.text) {
      height += line.gapAfter
      continue
    }
    measure.font = fontFor(line)
    const wrapped = wrapText(measure, line.text, contentWidth)
    height += wrapped.length * lineHeight(line.size) + line.gapAfter
  }
  height += PAD

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(WIDTH * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  ctx.scale(scale, scale)
  ctx.fillStyle = '#0f1419'
  ctx.fillRect(0, 0, WIDTH, height)
  ctx.textBaseline = 'top'

  let y = PAD
  for (const line of lines) {
    if (!line.text) {
      y += line.gapAfter
      continue
    }
    ctx.font = fontFor(line)
    ctx.fillStyle = line.color
    const wrapped = wrapText(ctx, line.text, contentWidth)
    const lh = lineHeight(line.size)
    for (const row of wrapped) {
      ctx.fillText(row, PAD, y)
      y += lh
    }
    y += line.gapAfter
  }

  return canvas
}

function fontFor(line: DrawLine): string {
  const weight = line.weight ?? 400
  return `${weight} ${line.size}px ${FONT_STACK}`
}

function lineHeight(size: number): number {
  return Math.ceil(size * 1.35)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text]

  const chars = [...text]
  const rows: string[] = []
  let current = ''
  for (const ch of chars) {
    const next = current + ch
    if (current && ctx.measureText(next).width > maxWidth) {
      rows.push(current)
      current = ch
    } else {
      current = next
    }
  }
  if (current) rows.push(current)
  return rows.length > 0 ? rows : [text]
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('长图导出失败：无法生成图片'))
      }, 'image/png')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '长图导出失败：画布无法导出'
      reject(
        new Error(
          message.includes('Tainted') || message.includes('tainted')
            ? '长图导出失败：画布被跨域资源污染，请刷新后重试'
            : `长图导出失败：${message}`,
        ),
      )
    }
  })
}

export const htmlLongImageExporter = new HtmlLongImageExporter()

/** @deprecated alias kept for scaffold naming */
export const stubLongImageExporter = htmlLongImageExporter
export const StubLongImageExporter = HtmlLongImageExporter
