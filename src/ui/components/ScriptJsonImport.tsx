import { useRef, useState, type ReactNode } from 'react'

type Props = {
  scriptName: string
  roleCount: number
  disabled?: boolean
  onImportJson: (text: string) => Promise<string | null>
  /** Seating circle (or other) to overlay the import button onto. */
  children: ReactNode
}

/**
 * Script JSON import on the 圆桌 tab: button sits on the seating circle
 * (bottom-right), panel opens below. Paste / file only.
 */
export function ScriptJsonImport({
  scriptName,
  roleCount,
  disabled,
  onImportJson,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto w-full max-w-[22rem]">
        {children}
        {/* Bottom-right of the circle — matches the marked empty pocket. */}
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            setOpen((v) => !v)
            setMessage(null)
          }}
          className="absolute bottom-[11%] right-[2%] z-20 min-h-10 max-w-[7.5rem] rounded-md border border-[var(--accent)] bg-[var(--bg-panel)]/95 px-2.5 py-2 text-sm leading-tight text-[var(--accent-soft)] shadow-sm backdrop-blur-sm touch-manipulation disabled:opacity-60"
        >
          {open ? '收起' : '导入 JSON'}
        </button>
      </div>

      {open && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-panel)] p-3">
          <p className="mb-1 text-sm font-medium">导入 townsquare Script JSON</p>
          <p className="mb-2 text-xs text-[var(--ink-muted)]">
            当前：{scriptName} · {roleCount}{' '}
            个角色。粘贴数组 JSON，或选择 .json 文件。
          </p>
          <textarea
            className="mb-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 font-mono text-xs"
            rows={6}
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            placeholder='[{"id":"_meta","name":"..."}, "washerwoman", {"id":"custom",...}]'
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white touch-manipulation disabled:opacity-60"
              disabled={busy || !text.trim()}
              onClick={() => {
                void (async () => {
                  setBusy(true)
                  setMessage(null)
                  try {
                    const result = await onImportJson(text)
                    setMessage(result ?? '导入成功')
                  } finally {
                    setBusy(false)
                  }
                })()
              }}
            >
              解析并应用
            </button>
            <button
              type="button"
              className="min-h-11 rounded-md border border-[var(--line)] px-3 py-2 text-sm touch-manipulation disabled:opacity-60"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              选择 .json 文件
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                setText(await file.text())
                setMessage(null)
              }}
            />
          </div>
          {message && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--accent-soft)]">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
