import { useEffect, useRef, useState, type ReactNode } from 'react'

export type ScriptImportFeedback = {
  /** One-line result for the chip / status. */
  summary: string
  /** Soft warnings; shown only after tapping the corner tip. */
  warnings?: string[]
  /** True when import failed (errors in details or summary). */
  failed?: boolean
}

type Props = {
  disabled?: boolean
  onImportJson: (text: string) => Promise<ScriptImportFeedback>
  /** Seating circle to anchor the corner import control. */
  children: ReactNode
}

/**
 * Tiny「导入」at the seating circle's bottom-right.
 * Import tips/warnings surface as a top-left chip (no screen flood).
 */
export function ScriptJsonImport({
  disabled,
  onImportJson,
  children,
}: Props) {
  const [feedback, setFeedback] = useState<ScriptImportFeedback | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const warningCount = feedback?.warnings?.length ?? 0
  const showTip =
    feedback != null && (feedback.failed || warningCount > 0)

  useEffect(() => {
    if (!detailOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailOpen])

  async function importFile(file: File) {
    setBusy(true)
    setFeedback(null)
    setDetailOpen(false)
    try {
      const text = await file.text()
      setFeedback(await onImportJson(text))
    } catch (e) {
      setFeedback({
        summary: e instanceof Error ? e.message : '导入失败',
        failed: true,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative mx-auto w-full max-w-[22rem]">
        {children}

        {showTip && (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className={`absolute left-0 top-0 z-20 max-w-[9.5rem] truncate rounded border px-2 py-1 text-[11px] leading-snug shadow-sm backdrop-blur-sm touch-manipulation ${
              feedback?.failed
                ? 'border-red-400/70 bg-[var(--bg-deep)]/95 text-red-300'
                : 'border-[var(--accent)] bg-[var(--bg-deep)]/95 text-[var(--accent-soft)]'
            }`}
            aria-label={
              feedback?.failed
                ? '查看导入错误'
                : `查看导入提示（${warningCount} 条）`
            }
            title={feedback?.summary}
          >
            {feedback?.failed
              ? '导入失败 · 查看'
              : `导入提示 · ${warningCount}`}
          </button>
        )}

        <button
          type="button"
          disabled={disabled || busy}
          aria-label="导入脚本 JSON 文件"
          title="选择 .json 脚本文件"
          onClick={() => {
            setFeedback(null)
            setDetailOpen(false)
            fileRef.current?.click()
          }}
          className="absolute bottom-0 right-0 z-20 min-h-8 rounded border border-[var(--accent)] bg-[var(--bg-deep)]/95 px-2 py-1 text-[11px] leading-none text-[var(--accent-soft)] shadow-sm backdrop-blur-sm touch-manipulation disabled:opacity-60"
        >
          {busy ? '…' : '导入'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            void importFile(file)
          }}
        />
      </div>

      {feedback && !showTip && (
        <p
          role="status"
          className="mx-auto w-full max-w-[22rem] text-center text-sm text-[var(--ink-muted)]"
        >
          {feedback.summary}
        </p>
      )}

      {detailOpen && feedback && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-3 sm:items-center"
          role="presentation"
          onClick={() => setDetailOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-tip-title"
            className="max-h-[80dvh] w-full max-w-md overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-panel)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <div className="min-w-0">
                <h3
                  id="import-tip-title"
                  className="text-base font-medium text-[var(--ink)]"
                >
                  {feedback.failed ? '导入失败' : '导入提示'}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                  {feedback.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="min-h-10 shrink-0 rounded-md px-2 text-sm text-[var(--ink-muted)] touch-manipulation"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>
            <div className="max-h-[min(60dvh,28rem)] overflow-y-auto overscroll-contain px-4 py-3">
              {warningCount > 0 ? (
                <ul className="flex flex-col gap-2 text-sm leading-snug text-[var(--accent-soft)]">
                  {feedback.warnings!.map((line, i) => (
                    <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  {feedback.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
