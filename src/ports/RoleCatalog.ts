import type { RoleDef } from '@/domain'

/** Global official (or other) role catalog — distinct from per-match RoleRegistry. */
export interface RoleCatalog {
  listRoles(): Promise<RoleDef[]>
  getRole(id: string): Promise<RoleDef | undefined>
}
