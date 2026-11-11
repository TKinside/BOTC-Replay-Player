import { useState } from 'react'

interface ScriptImportPanelProps {
  scriptName: string
  roleCount: number
  onImportJson: (text: string) => Promise<string | null>
  onUseTroubleBrewing: () => Promise<void>
}

const SAMPLE = `[
  {"id":"_meta","name":"示例自制本","author":"说书人"},
  "washerwoman",
  "librarian",
  "imp",
  {
    "id":"coffeebean",
    "name":"咖啡豆",
    "team":"townsfolk",
    "ability":"每个夜晚你可以喝一口咖啡提神。"
  }
]`

export function ScriptImportPanel({
  scriptName,
  roleCount,
  onImportJson,
  onUseTroubleBrewing,
}: ScriptImportPanelProps) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-medium">脚本</h3>
        <p className="text-sm text-[var(--ink-muted)]">
          当前：{scriptName} · {roleCount} 个角色
        </p>
      </div>

      <button
        type="button"
        className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setMessage(null)
          try {
            await onUseTroubleBrewing()
            setMessage('已切换为官方脚本「暗流涌动」')
          } finally {
            setBusy(false)
          }
        }}
      >
        使用官方库：暗流涌动
      </button>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink-muted)]">
          导入 townsquare Script JSON（粘贴）
        </span>
        <textarea
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 font-mono text-xs"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{"id":"_meta","name":"..."}, "washerwoman", ...]'
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white"
          disabled={busy || !text.trim()}
          onClick={async () => {
            setBusy(true)
            setMessage(null)
            try {
              const err = await onImportJson(text)
              setMessage(err ?? '导入成功')
            } finally {
              setBusy(false)
            }
          }}
        >
          解析并应用
        </button>
        <button
          type="button"
          className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
          onClick={() => setText(SAMPLE)}
        >
          填入示例 JSON
        </button>
        <label className="rounded-md border border-[var(--line)] px-3 py-2 text-sm">
          选择文件
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setText(await file.text())
            }}
          />
        </label>
      </div>

      {message && (
        <p className="text-sm text-[var(--accent-soft)] whitespace-pre-wrap">
          {message}
        </p>
      )}
    </div>
  )
}
