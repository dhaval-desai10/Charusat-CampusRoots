// ============================================
// Frontend RBAC Constants
// Single Source of Truth for Roles & Modules
// ============================================

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  FACULTY: 'faculty',
  ALUMNI: 'alumni',
  STUDENT: 'student'
});

export const MODULES = Object.freeze({
  FEED: 'feed',
  REUNION: 'reunion',
  GALLERY: 'gallery',
  CONTRIBUTION: 'contribution',
  INTERNSHIP: 'internship'
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));
export const ALL_MODULES = Object.freeze(Object.values(MODULES));

export const MODULE_LABELS = Object.freeze({
  [MODULES.FEED]: 'Feed',
  [MODULES.REUNION]: 'Reunions',
  [MODULES.GALLERY]: 'Gallery',
  [MODULES.CONTRIBUTION]: 'Contributions',
  [MODULES.INTERNSHIP]: 'Internships'
});
