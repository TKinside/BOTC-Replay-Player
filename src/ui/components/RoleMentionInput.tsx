import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import type { RoleDef } from '@/domain'
import {
  activeMentionAt,
  filterRolesForMention,
  insertMention,
} from '@/lib/customTextCompose'
import { FACTION_LABEL } from '../lib/factionColor'
import { RoleIcon } from './RoleIcon'

type Props = {
  value: string
  onChange: (value: string) => void
  roles: readonly RoleDef[]
  rows?: number
  placeholder?: string
  className?: string
  'aria-label'?: string
}

/**
 * Textarea that offers script-role autocomplete after typing `@`.
 */
export function RoleMentionInput({
  value,
  onChange,
  roles,
  rows = 3,
  placeholder,
  className = '',
  'aria-label': ariaLabel,
}: Props) {
  const listId = useId()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [cursor, setCursor] = useState(0)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)
  const pendingCursor = useRef<number | null>(null)

  const active = activeMentionAt(value, cursor)
  const mentionKey = active ? `${active.start}:${active.query}` : null
  const open = Boolean(active) && mentionKey !== dismissedKey
  const suggestions = open
    ? filterRolesForMention(roles, active?.query ?? '').slice(0, 8)
    : []
  const activeHighlight =
    suggestions.length === 0 ? 0 : highlight % suggestions.length

  useLayoutEffect(() => {
    if (pendingCursor.current == null || !taRef.current) return
    const pos = pendingCursor.current
    pendingCursor.current = null
    taRef.current.focus()
    taRef.current.setSelectionRange(pos, pos)
    setCursor(pos)
  }, [value])

  function applyRole(role: RoleDef) {
    const next = insertMention(value, cursor, role.name)
    onChange(next.value)
    pendingCursor.current = next.cursor
    // Keep the completed `@角色名` from re-opening the picker until @ is typed again.
    const after = activeMentionAt(next.value, next.cursor)
    setDismissedKey(
      after ? `${after.start}:${after.query}` : `applied:${role.id}`,
    )
  }

  function syncCursorFromEvent(el: HTMLTextAreaElement) {
    setCursor(el.selectionStart ?? 0)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % suggestions.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const role = suggestions[activeHighlight]
      if (role) applyRole(role)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (mentionKey) setDismissedKey(mentionKey)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        className={className}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open && suggestions.length > 0}
        onChange={(e) => {
          onChange(e.target.value)
          setCursor(e.target.selectionStart ?? e.target.value.length)
        }}
        onKeyDown={onKeyDown}
        onClick={(e) => syncCursorFromEvent(e.currentTarget)}
        onKeyUp={(e) => syncCursorFromEvent(e.currentTarget)}
        onSelect={(e) => syncCursorFromEvent(e.currentTarget)}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute bottom-full left-0 z-10 mb-1 max-h-48 w-full overflow-y-auto rounded-md border border-[var(--line)] bg-[var(--bg-panel)] py-1 shadow-lg"
        >
          {suggestions.map((role, i) => (
            <li
              key={role.id}
              role="option"
              aria-selected={i === activeHighlight}
            >
              <button
                type="button"
                className={`flex min-h-10 w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm touch-manipulation ${
                  i === activeHighlight
                    ? 'bg-[var(--bg-elevated)] text-[var(--accent-soft)]'
                    : 'text-[var(--ink)]'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applyRole(role)
                }}
                onMouseEnter={() => setHighlight(i)}
              >
                <RoleIcon role={role} size={20} />
                <span className="min-w-0 flex-1 truncate">{role.name}</span>
                <span className="shrink-0 text-[10px] text-[var(--ink-muted)]">
                  {FACTION_LABEL[role.faction] ?? role.faction}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
