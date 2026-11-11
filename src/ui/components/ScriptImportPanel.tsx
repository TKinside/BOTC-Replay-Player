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

      <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--ink-muted)]">
        <li>有魔典 Script JSON → 粘贴或选文件导入（含自制角色）。</li>
        <li>没有 JSON → 使用官方库「暗流涌动」，再在圆桌手动指派。</li>
      </ol>

      <button
        type="button"
        className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm touch-manipulation"
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

      <div className="rounded-lg border border-dashed border-[var(--accent-soft)]/40 bg-[var(--bg-deep)]/40 p-3">
        <p className="mb-2 text-sm font-medium">导入 townsquare Script JSON</p>
        <p className="mb-2 text-xs text-[var(--ink-muted)]">
          顶层必须是数组：可含 <code className="text-[var(--accent-soft)]">_meta</code>
          、角色 id 字符串、或完整自制角色对象。
        </p>
        <textarea
          className="mb-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 font-mono text-xs"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{"id":"_meta","name":"..."}, "washerwoman", {"id":"custom",...}]'
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-white touch-manipulation"
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
            className="min-h-11 rounded-md border border-[var(--line)] px-3 py-2 text-sm touch-manipulation"
            onClick={() => setText(SAMPLE)}
          >
            填入示例
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-[var(--line)] px-3 py-2 text-sm touch-manipulation">
            选择 .json 文件
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
          <a
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--accent-soft)]"
            href={`${import.meta.env.BASE_URL}samples/custom-script.sample.json`}
            target="_blank"
            rel="noreferrer"
          >
            打开样例文件
          </a>
        </div>
      </div>

      {message && (
        <p className="whitespace-pre-wrap text-sm text-[var(--accent-soft)]">
          {message}
        </p>
      )}
    </div>
  )
}
