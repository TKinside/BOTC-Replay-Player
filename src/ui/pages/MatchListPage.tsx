import { Link } from 'react-router-dom'

/**
 * Match list home — cards will bind to IndexedDB via application layer later.
 * Stats tab is a deliberate stub (post-MVP).
 */
export function MatchListPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">对局列表</h2>
            <p className="text-sm text-[var(--ink-muted)]">
              本地已存对局（IndexedDB stub，暂无数据）
            </p>
          </div>
          <Link
            to="/matches/new"
            className="shrink-0 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            新建对局
          </Link>
        </div>

        <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--bg-panel)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
          还没有对局。导入 townsquare Script JSON，或从官方角色库手动指派。
        </div>
      </section>

      <section aria-label="统计占位">
        <h2 className="mb-1 text-lg font-medium text-[var(--ink-muted)]">
          统计
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          占位入口 — 统计面板延后至 MVP 之后。
        </p>
      </section>
    </div>
  )
}
