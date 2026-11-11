import type { Match, Player, RoleDef } from '@/domain'
import { FACTION_LABEL } from '../lib/factionColor'
import { RoleChip } from './RoleChip'

interface PlayerEditorProps {
  match: Match
  player: Player | null
  onRename: (playerId: string, name: string) => void
  onAssignRole: (playerId: string, roleId: string | undefined) => void
  onRemove: (playerId: string) => void
}

export function PlayerEditor({
  match,
  player,
  onRename,
  onAssignRole,
  onRemove,
}: PlayerEditorProps) {
  if (!player) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">点选圆桌座位以编辑玩家。</p>
    )
  }

  const roles = groupRoles(match.script.roles)

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--ink-muted)]">昵称</span>
        <input
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2"
          value={player.name}
          onChange={(e) => onRename(player.id, e.target.value)}
        />
      </label>

      <div>
        <p className="mb-2 text-sm text-[var(--ink-muted)]">指派角色</p>
        <div className="mb-2">
          <button
            type="button"
            className="text-xs text-[var(--accent-soft)]"
            onClick={() => onAssignRole(player.id, undefined)}
          >
            清除角色
          </button>
        </div>
        <div className="flex max-h-48 flex-col gap-3 overflow-y-auto pr-1">
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
                    className={`rounded-md border px-0.5 py-0.5 ${
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
        </div>
      </div>

      <button
        type="button"
        className="self-start text-sm text-red-300"
        onClick={() => onRemove(player.id)}
      >
        移除此座位
      </button>
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
