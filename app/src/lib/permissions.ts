import { Role } from '@prisma/client'

/**
 * Role hierarchy: ADMIN > MANAGER > STAFF > VOLUNTEER
 * Higher roles inherit all permissions of lower roles.
 */
const ROLE_RANK: Record<Role, number> = {
  ADMIN: 100,
  MANAGER: 50,
  STAFF: 10,
  VOLUNTEER: 5,
}

export function hasAtLeastRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required]
}

export function isAdmin(role: Role): boolean {
  return role === 'ADMIN'
}

export function isManager(role: Role): boolean {
  return hasAtLeastRole(role, 'MANAGER')
}

export type Action =
  | 'attendance.viewAll'
  | 'attendance.viewOwn'
  | 'leave.approve'
  | 'leave.viewAll'
  | 'project.create'
  | 'project.deleteOwn'
  | 'kpi.assignOthers'
  | 'document.viewSensitive'
  | 'expense.approve'
  | 'expense.markPaid'
  | 'user.manage'
  | 'audit.read'

const PERMISSIONS: Record<Action, Role[]> = {
  'attendance.viewAll': ['ADMIN', 'MANAGER'],
  'attendance.viewOwn': ['ADMIN', 'MANAGER', 'STAFF', 'VOLUNTEER'],
  'leave.approve': ['ADMIN', 'MANAGER'],
  'leave.viewAll': ['ADMIN', 'MANAGER'],
  'project.create': ['ADMIN', 'MANAGER'],
  'project.deleteOwn': ['ADMIN', 'MANAGER', 'STAFF'],
  'kpi.assignOthers': ['ADMIN', 'MANAGER'],
  'document.viewSensitive': ['ADMIN'],
  'expense.approve': ['ADMIN', 'MANAGER'],
  'expense.markPaid': ['ADMIN'],
  'user.manage': ['ADMIN'],
  'audit.read': ['ADMIN'],
}

export function can(userRole: Role, action: Action): boolean {
  return PERMISSIONS[action]?.includes(userRole) ?? false
}
