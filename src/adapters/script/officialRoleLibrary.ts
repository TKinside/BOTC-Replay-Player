import type { RoleDef, ScriptSnapshot } from '@/domain'
import type { RoleCatalog } from '@/ports'
import { cleanRoleId } from './normalize'
import { TROUBLE_BREWING_ROLES } from './officialRoles/troubleBrewing'

const ALL_OFFICIAL: RoleDef[] = [...TROUBLE_BREWING_ROLES]

const BY_ID = new Map(ALL_OFFICIAL.map((r) => [r.id, r]))

/**
 * OfficialRoleLibrary — built-in catalog for no-JSON manual assignment
 * and for completing known ids when importing townsquare Script JSON.
 */
export class OfficialRoleLibrary implements RoleCatalog {
  async listRoles(): Promise<RoleDef[]> {
    return [...ALL_OFFICIAL]
  }

  async getRole(id: string): Promise<RoleDef | undefined> {
    return BY_ID.get(cleanRoleId(id))
  }

  getRoleSync(id: string): RoleDef | undefined {
    return BY_ID.get(cleanRoleId(id))
  }

  listSync(): RoleDef[] {
    return [...ALL_OFFICIAL]
  }

  /** Frozen TB / 暗流涌动 script snapshot for official-library origin matches. */
  buildTroubleBrewingSnapshot(): ScriptSnapshot {
    return {
      origin: { kind: 'official-library', editionId: 'tb' },
      id: 'tb',
      name: '暗流涌动',
      author: 'The Pandemonium Institute',
      roles: TROUBLE_BREWING_ROLES.map((r) => ({ ...r })),
      meta: { edition: 'tb' },
    }
  }
}

export const officialRoleLibrary = new OfficialRoleLibrary()
