import { Link, useParams } from 'react-router-dom'

/**
 * Placeholder match editor shell (mobile-first).
 * Seating circle, event entry, and export UI land in later stages.
 */
export function MatchEditorPage() {
  const { matchId } = useParams()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-sm text-[var(--accent-soft)] underline-offset-2 hover:underline"
        >
          ← 返回列表
        </Link>
        <span className="truncate font-mono text-xs text-[var(--ink-muted)]">
          {matchId}
        </span>
      </div>

      <section className="rounded-lg bg-[var(--bg-panel)] p-4">
        <h2 className="text-lg font-medium">对局编辑器</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          脚手架占位：圆形座位、脚本导入、夜/昼事件录入尚未接上。
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StubBlock title="圆桌座位" hint="加人 / 昵称 / 角色" />
        <StubBlock title="脚本" hint="JSON 导入 / 官方库" />
        <StubBlock title="事件日志" hint="夜 / 昼阶段轴" />
        <StubBlock title="长图导出" hint="昵称原样保留" />
      </section>
    </div>
  )
}

function StubBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p>
    </div>
  )
}
