import type { Role } from './store'

// Permission-based access: screens check a permission, never a role name.
// In the real build this table lives in the database so roles can change without code changes.
export type Permission =
  | 'athlete.search' | 'athlete.view' | 'shortlist.manage' | 'film.review'
  | 'profile.edit_own' | 'film.upload' | 'document.manage_own'
  | 'document.verify' | 'coach.verify' | 'audit.view'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  coach: ['athlete.search', 'athlete.view', 'shortlist.manage', 'film.review'],
  athlete: ['profile.edit_own', 'film.upload', 'document.manage_own', 'athlete.view'],
  admin: ['athlete.view', 'film.review', 'document.verify', 'coach.verify', 'audit.view'],
}

export const can = (role: Role, p: Permission) => ROLE_PERMISSIONS[role].includes(p)
