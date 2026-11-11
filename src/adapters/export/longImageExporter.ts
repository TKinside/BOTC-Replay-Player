import type { Match } from '@/domain'
import type { LongImageExporter } from '@/ports'

/**
 * Long-image export: render an off-DOM panel and capture via Canvas.
 * Nicknames are exported as-is (no anonymize / mask).
 */
export class HtmlLongImageExporter implements LongImageExporter {
  async exportMatch(match: Match): Promise<Blob> {
    if (typeof document === 'undefined') {
      return new Blob(
        [`《血染钟楼复盘器》\n${match.script.name}\n${playerLines(match)}`],
        { type: 'text/plain;charset=utf-8' },
      )
    }

    const root = document.createElement('div')
    root.setAttribute('data-botc-export', '1')
    Object.assign(root.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: '720px',
      padding: '32px',
      background: '#0f1419',
      color: '#e8eef4',
      fontFamily:
        '"Segoe UI","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
      boxSizing: 'border-box',
    })
    root.innerHTML = buildExportHtml(match)
    document.body.appendChild(root)

    try {
      const canvas = await renderNodeToCanvas(root)
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error('长图导出失败：无法生成图片')),
          'image/png',
        )
      })
    } finally {
      root.remove()
    }
  }
}

function playerLines(match: Match): string {
  return match.players
    .map((p) => {
      const role = match.script.roles.find((r) => r.id === p.roleId)
      return `${p.seatIndex + 1}. ${p.name}${role ? ` · ${role.name}` : ''}`
    })
    .join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildExportHtml(match: Match): string {
  const players = match.players
    .slice()
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .map((p) => {
      const role = match.script.roles.find((r) => r.id === p.roleId)
      return `<li style="margin:4px 0"><strong>${escapeHtml(p.name)}</strong> · 座位 ${p.seatIndex + 1}${
        role ? ` · <span style="color:#e8a090">${escapeHtml(role.name)}</span>` : ''
      }</li>`
    })
    .join('')

  const phases = match.phases
    .map((phase) => {
      const events = match.events.filter((e) => e.phaseId === phase.id)
      if (events.length === 0 && phase.kind === 'setup') return ''
      const lines = events
        .map(
          (e) =>
            `<div style="margin:6px 0;padding:8px 10px;background:#1a222c;border-radius:8px">${escapeHtml(
              e.text || e.typeId,
            )}</div>`,
        )
        .join('')
      return `<section style="margin-top:20px"><h3 style="margin:0 0 8px;font-size:16px;color:#9aabbc">${escapeHtml(
        phase.label || phase.kind,
      )}</h3>${lines || '<div style="color:#9aabbc;font-size:13px">（无事件）</div>'}</section>`
    })
    .join('')

  return `
    <header style="border-bottom:1px solid #2e3a48;padding-bottom:16px;margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:0.12em;color:#9aabbc">BOTC REPLAY</div>
      <h1 style="margin:8px 0 4px;font-size:28px">《血染钟楼复盘器》</h1>
      <div style="font-size:16px">${escapeHtml(match.script.name)}${
        match.title ? ` · ${escapeHtml(match.title)}` : ''
      }</div>
      <div style="margin-top:6px;font-size:12px;color:#9aabbc">${escapeHtml(
        match.updatedAt,
      )} · ${match.players.length} 人</div>
    </header>
    <section>
      <h2 style="margin:0 0 8px;font-size:18px">座位与昵称</h2>
      <ul style="margin:0;padding-left:18px">${players || '<li>暂无玩家</li>'}</ul>
    </section>
    ${phases}
    <footer style="margin-top:24px;font-size:12px;color:#9aabbc">昵称原样导出 · 无打码</footer>
  `
}

async function renderNodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const width = node.offsetWidth || 720
  const height = Math.max(node.scrollHeight, node.offsetHeight, 400)
  const canvas = document.createElement('canvas')
  const scale = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  ctx.scale(scale, scale)
  ctx.fillStyle = '#0f1419'
  ctx.fillRect(0, 0, width, height)

  // foreignObject SVG snapshot — keeps Chinese text + nicknames
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${node.outerHTML}</div>
      </foreignObject>
    </svg>`
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = await loadImage(url)
    ctx.drawImage(img, 0, 0)
  } finally {
    URL.revokeObjectURL(url)
  }
  return canvas
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('长图渲染失败'))
    img.src = url
  })
}

export const htmlLongImageExporter = new HtmlLongImageExporter()

/** @deprecated alias kept for scaffold naming */
export const stubLongImageExporter = htmlLongImageExporter
export const StubLongImageExporter = HtmlLongImageExporter
