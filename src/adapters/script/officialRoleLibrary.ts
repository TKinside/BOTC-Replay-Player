import type { RoleDef } from '@/domain'
import type { RoleCatalog } from '@/ports'

/**
 * OfficialRoleLibrary — placeholder catalog for no-JSON manual assignment.
 * Stage A follow-up: seed a real subset aligned with the official Chinese wiki.
 */
const PLACEHOLDER_ROLES: RoleDef[] = [
  {
    id: 'washerwoman',
    name: '洗衣妇',
    faction: 'townsfolk',
    ability: '占位：官方角色库尚未灌入全文能力。',
    source: 'official',
  },
  {
    id: 'imp',
    name: '小恶魔',
    faction: 'demon',
    ability: '占位：官方角色库尚未灌入全文能力。',
    source: 'official',
  },
]

export class OfficialRoleLibrary implements RoleCatalog {
  async listRoles(): Promise<RoleDef[]> {
    return [...PLACEHOLDER_ROLES]
  }

  async getRole(id: string): Promise<RoleDef | undefined> {
    return PLACEHOLDER_ROLES.find((r) => r.id === id)
  }
}

export const officialRoleLibrary = new OfficialRoleLibrary()
