import type { RoleDef, ScriptSnapshot } from '@/domain'
import type { RoleCatalog } from '@/ports'
import { cleanRoleId } from './normalize'
import { TROUBLE_BREWING_ROLES } from './officialRoles/troubleBrewing'
import { TRAVELER_ROLES } from './officialRoles/travelers'

export interface OfficialEdition {
  id: string
  name: string
  /** Roles frozen into a new match of this edition (no travelers by default). */
  roleIds: string[]
}

const ALL_OFFICIAL: RoleDef[] = [...TROUBLE_BREWING_ROLES, ...TRAVELER_ROLES]

const BY_ID = new Map(ALL_OFFICIAL.map((r) => [r.id, r]))

const EDITIONS: OfficialEdition[] = [
  {
    id: 'tb',
    name: '暗流涌动',
    roleIds: TROUBLE_BREWING_ROLES.map((r) => r.id),
  },
]

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

  listEditions(): OfficialEdition[] {
    return EDITIONS.map((e) => ({ ...e, roleIds: [...e.roleIds] }))
  }

  /** Frozen TB / 暗流涌动 script snapshot (core cast; travelers stay in catalog). */
  buildTroubleBrewingSnapshot(): ScriptSnapshot {
    return {
      origin: { kind: 'official-library', editionId: 'tb' },
      id: 'tb',
      name: '暗流涌动',
      author: 'The Pandemonium Institute',
      roles: TROUBLE_BREWING_ROLES.map((r) => ({ ...r })),
      meta: {
        edition: 'tb',
        travelerIds: TRAVELER_ROLES.map((r) => r.id),
      },
    }
  }
}

export const officialRoleLibrary = new OfficialRoleLibrary()
