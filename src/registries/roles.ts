import type { RoleDef } from '@/domain'

/**
 * Per-match RoleRegistry: Map of roles available in this match
 * (imported custom roles merged in). Distinct from OfficialRoleLibrary.
 */
export class RoleRegistry {
  private readonly byId = new Map<string, RoleDef>()

  constructor(roles: RoleDef[] = []) {
    for (const role of roles) {
      this.byId.set(role.id, role)
    }
  }

  get(id: string): RoleDef | undefined {
    return this.byId.get(id)
  }

  list(): RoleDef[] {
    return [...this.byId.values()]
  }

  upsert(role: RoleDef): void {
    this.byId.set(role.id, role)
  }
}
