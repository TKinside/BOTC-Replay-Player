import { useEffect, useId, useRef } from 'react'
import type { Match, Player, RoleDef } from '@/domain'
import { FACTION_LABEL } from '../lib/factionColor'
import { RoleChip } from './RoleChip'

interface PlayerEditorProps {
  match: Match
  player: Player
  onClose: () => void
  onRename: (playerId: string, name: string) => void
  onAssignRole: (playerId: string, roleId: string | undefined) => void
  onRemove: (playerId: string) => void
}

/** Modal editor opened by tapping a seat on the 圆桌. */
export function PlayerEditor({
  match,
  player,
  onClose,
  onRename,
  onAssignRole,
  onRemove,
}: PlayerEditorProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const roles = groupRoles(match.script.roles)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="点击关闭编辑面板"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--line)] bg-[var(--bg-panel)] shadow-xl outline-none sm:mx-4 sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            <h3 id={titleId} className="truncate text-base font-medium">
              座位 {player.seatIndex + 1}
            </h3>
            <p className="truncate text-xs text-[var(--ink-muted)]">
              改名 · 指派角色 · 移除
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 shrink-0 rounded-md px-3 text-sm text-[var(--ink-muted)] touch-manipulation"
          >
            关闭
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--ink-muted)]">昵称</span>
            <input
              className="min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 text-base sm:text-sm"
              value={player.name}
              autoComplete="off"
              onChange={(e) => onRename(player.id, e.target.value)}
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm text-[var(--ink-muted)]">指派角色</p>
              <button
                type="button"
                className="min-h-10 text-sm text-[var(--accent-soft)] touch-manipulation"
                onClick={() => onAssignRole(player.id, undefined)}
              >
                清除角色
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {roles.map(([faction, list]) => (
                <div key={faction}>
                  <p className="mb-1 text-xs text-[var(--ink-muted)]">
                    {FACTION_LABEL[faction as RoleDef['faction']] ?? faction}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => onAssignRole(player.id, role.id)}
                        className={`min-h-10 rounded-md border px-0.5 py-0.5 touch-manipulation ${
                          player.roleId === role.id
                            ? 'border-[var(--accent-soft)]'
                            : 'border-transparent'
                        }`}
                      >
                        <RoleChip role={role} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {roles.length === 0 && (
                <p className="text-xs text-[var(--ink-muted)]">
                  当前脚本没有角色 — 请先导入 Script JSON
                </p>
              )}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[var(--line)] px-4 py-3">
          <button
            type="button"
            className="min-h-11 w-full rounded-md border border-red-400/40 px-3 py-2 text-sm text-red-300 touch-manipulation"
            onClick={() => onRemove(player.id)}
          >
            移除此座位
          </button>
        </footer>
      </div>
    </div>
  )
}

function groupRoles(roles: RoleDef[]): [string, RoleDef[]][] {
  const order = [
    'townsfolk',
    'outsider',
    'minion',
    'demon',
    'traveler',
    'fabled',
    'loric',
    'unknown',
  ]
  const map = new Map<string, RoleDef[]>()
  for (const role of roles) {
    const list = map.get(role.faction) ?? []
    list.push(role)
    map.set(role.faction, list)
  }
  return order
    .filter((f) => map.has(f))
    .map((f) => [f, map.get(f)!] as [string, RoleDef[]])
}
