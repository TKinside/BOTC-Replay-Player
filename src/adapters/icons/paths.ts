/** Public path prefix for user-dropped official role icons. */
export const ROLE_ICON_DIR = 'icons/roles'

/** Tried in order when resolving a local pack asset. */
export const ROLE_ICON_EXTENSIONS = ['webp', 'png', 'svg', 'jpg'] as const

export type RoleIconExtension = (typeof ROLE_ICON_EXTENSIONS)[number]

/** Absolute-from-site-root URL for a role icon candidate. */
export function roleIconAssetUrl(
  roleId: string,
  ext: RoleIconExtension,
  baseUrl = import.meta.env.BASE_URL || '/',
): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${base}${ROLE_ICON_DIR}/${roleId}.${ext}`
}

export function roleIconCandidates(
  roleId: string,
  baseUrl = import.meta.env.BASE_URL || '/',
): string[] {
  return ROLE_ICON_EXTENSIONS.map((ext) =>
    roleIconAssetUrl(roleId, ext, baseUrl),
  )
}
