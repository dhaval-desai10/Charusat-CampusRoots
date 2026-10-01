// ============================================
// RBAC (Role-Based Access Control) Constants
// Single Source of Truth for Roles and Modules
// ============================================

/**
 * User Roles across CampusRoots Platform
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  FACULTY: 'faculty',
  ALUMNI: 'alumni',
  STUDENT: 'student'
});

/**
 * Platform Functional Modules protected by RBAC
 */
export const MODULES = Object.freeze({
  FEED: 'feed',
  REUNION: 'reunion',
  GALLERY: 'gallery',
  CONTRIBUTION: 'contribution',
  INTERNSHIP: 'internship'
});

/**
 * Roles that can have their module permissions configured by an Admin.
 * (Admin is the superuser who always has access to all modules)
 */
export const ASSIGNABLE_ROLES = Object.freeze([
  ROLES.STUDENT,
  ROLES.FACULTY,
  ROLES.ALUMNI
]);

/**
 * All valid user roles in the system
 */
export const ALL_ROLES = Object.freeze(Object.values(ROLES));

/**
 * All valid modules in the system
 */
export const ALL_MODULES = Object.freeze(Object.values(MODULES));

/**
 * Human-readable module labels (used for display in UI & reports)
 */
export const MODULE_LABELS = Object.freeze({
  [MODULES.FEED]: 'Feed & Posts',
  [MODULES.REUNION]: 'Reunion Management',
  [MODULES.GALLERY]: 'Photo Gallery',
  [MODULES.CONTRIBUTION]: 'Contributions & Donations',
  [MODULES.INTERNSHIP]: 'Internship Opportunities'
});

/**
 * Default permission matrix for initial seeding
 */
export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  [ROLES.STUDENT]: {
    [MODULES.FEED]: true,
    [MODULES.REUNION]: true,
    [MODULES.GALLERY]: true,
    [MODULES.CONTRIBUTION]: true,
    [MODULES.INTERNSHIP]: true
  },
  [ROLES.FACULTY]: {
    [MODULES.FEED]: true,
    [MODULES.REUNION]: true,
    [MODULES.GALLERY]: true,
    [MODULES.CONTRIBUTION]: true,
    [MODULES.INTERNSHIP]: true
  },
  [ROLES.ALUMNI]: {
    [MODULES.FEED]: true,
    [MODULES.REUNION]: true,
    [MODULES.GALLERY]: true,
    [MODULES.CONTRIBUTION]: true,
    [MODULES.INTERNSHIP]: true
  }
});
