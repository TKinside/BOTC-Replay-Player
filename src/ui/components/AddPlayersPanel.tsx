import { useMemo, useState } from 'react'
import { parsePlayerNames } from '@/domain'

type Props = {
  busy: boolean
  onAddOne: (name: string) => void
  onAddBatch: (names: string[]) => void
}

/** Seating-area controls: quick single add + paste-friendly batch add. */
export function AddPlayersPanel({ busy, onAddOne, onAddBatch }: Props) {
  const [batchText, setBatchText] = useState('')
  const previewNames = useMemo(
    () => parsePlayerNames(batchText),
    [batchText],
  )

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const name = String(fd.get('playerName') ?? '').trim()
          if (!name) return
          const form = e.currentTarget
          onAddOne(name)
          form.reset()
        }}
      >
        <input
          name="playerName"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 text-base sm:text-sm"
          placeholder="新玩家昵称"
          autoComplete="off"
          enterKeyHint="done"
          disabled={busy}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white touch-manipulation disabled:opacity-60"
        >
          加人
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--ink-muted)]" htmlFor="batch-names">
          批量加人（每行一个昵称，也可用顿号、逗号或空格分隔）
        </label>
        <textarea
          id="batch-names"
          value={batchText}
          onChange={(e) => setBatchText(e.target.value)}
          rows={4}
          disabled={busy}
          placeholder={'例如：\n阿徒\n小果\n夜枭'}
          className="min-h-24 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 text-base leading-relaxed sm:text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--ink-muted)]">
            {previewNames.length > 0
              ? `将加入 ${previewNames.length} 人`
              : '粘贴或输入后可预览人数'}
          </p>
          <button
            type="button"
            disabled={busy || previewNames.length === 0}
            onClick={() => {
              onAddBatch(previewNames)
              setBatchText('')
            }}
            className="min-h-11 rounded-md border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent-soft)] touch-manipulation disabled:opacity-60"
          >
            批量加入
          </button>
        </div>
      </div>
    </div>
  )
}
