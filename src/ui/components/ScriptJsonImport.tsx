import { useRef, useState, type ReactNode } from 'react'

type Props = {
  scriptName: string
  roleCount: number
  disabled?: boolean
  onImportJson: (text: string) => Promise<string | null>
  /** Seating circle rendered above the import control. */
  children: ReactNode
}

/**
 * Script JSON import on the 圆桌 tab.
 * Button sits under the circle on the right (outside seats).
 * Click opens a .json file picker only — no paste UI.
 */
export function ScriptJsonImport({
  scriptName,
  roleCount,
  disabled,
  onImportJson,
  children,
}: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function importFile(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      const text = await file.text()
      const result = await onImportJson(text)
      setMessage(result ?? '导入成功')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '导入失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mx-auto w-full max-w-[22rem]">{children}</div>

      {/* Right-aligned under the circle — clear of seat tokens. */}
      <div className="mx-auto flex w-full max-w-[22rem] items-center justify-end gap-2">
        <p className="min-w-0 flex-1 truncate text-xs text-[var(--ink-muted)]">
          脚本：{scriptName} · {roleCount} 角色
        </p>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            setMessage(null)
            fileRef.current?.click()
          }}
          className="min-h-10 shrink-0 rounded-md border border-[var(--accent)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--accent-soft)] touch-manipulation disabled:opacity-60"
        >
          {busy ? '导入中…' : '导入 JSON'}
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

      {message && (
        <p
          role="status"
          className="mx-auto w-full max-w-[22rem] whitespace-pre-wrap text-sm text-[var(--accent-soft)]"
        >
          {message}
        </p>
      )}
    </div>
  )
}
