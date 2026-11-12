import { useRef, useState, type ReactNode } from 'react'

type Props = {
  disabled?: boolean
  onImportJson: (text: string) => Promise<string | null>
  /** Seating circle to anchor the corner import control. */
  children: ReactNode
}

/**
 * Tiny「导入」control at the seating circle's bottom-right corner.
 * One tap → native .json file picker (no paste UI).
 */
export function ScriptJsonImport({
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
      <div className="relative mx-auto w-full max-w-[22rem]">
        {children}
        {/* Outside the seat ring, flush to the square's bottom-right corner. */}
        <button
          type="button"
          disabled={disabled || busy}
          aria-label="导入脚本 JSON 文件"
          title="选择 .json 脚本文件"
          onClick={() => {
            setMessage(null)
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
