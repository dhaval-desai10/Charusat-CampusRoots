// ============================================
// RBAC (Role-Based Access Control) Constants
// ============================================

import {
  ROLES,
  MODULES,
  ALL_ROLES,
  ALL_MODULES,
  MODULE_LABELS
} from '../constants/rbac.js';

export {
  ROLES,
  MODULES,
  ALL_ROLES,
  ALL_MODULES,
  MODULE_LABELS
};

/**
 * Role-based Feature Permissions
 * Centralized access control for all features
 */
export const ROLE_PERMISSIONS = {
  student: {
    canPostInternships: false,
    canContribute: false,
    canFeedback: false,
    canApplyInternships: true,
    canViewGallery: true,
    canMessage: true,
    canViewNetwork: true,
    canCreatePosts: true,
    canRegisterReunion: false
  },
  alumni: {
    canPostInternships: true,
    canContribute: true,
    canFeedback: true,
    canApplyInternships: false,
    canViewGallery: true,
    canMessage: true,
    canViewNetwork: true,
    canCreatePosts: true,
    canRegisterReunion: true,
    canProposeReunion: false
  },
  faculty: {
    canPostInternships: false,
    canContribute: false,
    canFeedback: false,
    canApplyInternships: false,
    canViewGallery: true,
    canMessage: true,
    canViewNetwork: true,
    canCreatePosts: false,
    canRegisterReunion: true,
    canProposeReunion: true
  },
  admin: {
    canManageUsers: true,
    canModerateContent: true,
    canAccessDashboard: true,
    canViewAnalytics: true,
    canApprovePosts: true,
    canApproveReunions: true,
    canApproveGallery: true,
    canExportData: true
  }
};

/**
 * Role Display Configuration
 * Styling and labels for role badges across UI
 */
export const ROLE_DISPLAY = {
  student: {
    label: 'Student',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    icon: '🎓'
  },
  alumni: {
    label: 'Alumni',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    icon: '⭐'
  },
  faculty: {
    label: 'Faculty',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    icon: '👨‍🏫'
  },
  admin: {
    label: 'Admin',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    icon: '🛡️'
  }
};

/**
 * Role-based Feature Navigation
 * Determines which features are visible per role
 */
export const ROLE_FEATURES = {
  student: ['Home', 'Feed', 'Reunions', 'Gallery', 'Network', 'Internships', 'Messages'],
  alumni: ['Home', 'Feed', 'Reunions', 'Gallery', 'Network', 'Feedback', 'Contribute', 'Internships', 'Messages'],
  faculty: ['Home', 'Feed', 'Reunions', 'Gallery', 'Network', 'Internships', 'Messages'],
  admin: ['Dashboard', 'Users', 'Posts', 'Reunions', 'Gallery', 'Feedback', 'Contributions', 'Internships']
};

/**
 * Utility Function: Check if user has permission
 * @param {string} userRole - User's role (student, alumni, faculty, admin)
 * @param {string} permission - Permission to check (e.g., 'canContribute')
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (userRole, permission) => {
  return ROLE_PERMISSIONS[userRole]?.[permission] === true;
};

/**
 * Utility Function: Check if user has any role
 * @param {string} userRole - User's role to check
 * @returns {boolean} - True if role is valid
 */
export const isValidRole = (userRole) => {
  return Object.values(ROLES).includes(userRole);
};

/**
 * Utility Function: Get role display config
 * @param {string} role - User's role
 * @returns {object} - Role display configuration with fallback to alumni
 */
export const getRoleDisplay = (role) => {
  return ROLE_DISPLAY[role] || ROLE_DISPLAY.alumni;
};

/**
 * Utility Function: Check if user is admin
 * @param {string} userRole - User's role
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (userRole) => {
  return userRole === ROLES.ADMIN;
};

/**
 * Utility Function: Check if user is alumni
 * @param {string} userRole - User's role
 * @returns {boolean} - True if user is alumni
 */
export const isAlumni = (userRole) => {
  return userRole === ROLES.ALUMNI;
};

/**
 * Utility Function: Check if user is student
 * @param {string} userRole - User's role
 * @returns {boolean} - True if user is student
 */
export const isStudent = (userRole) => {
  return userRole === ROLES.STUDENT;
};

/**
 * Utility Function: Check if user is faculty
 * @param {string} userRole - User's role
 * @returns {boolean} - True if user is faculty
 */
export const isFaculty = (userRole) => {
  return userRole === ROLES.FACULTY;
};

/**
 * Utility Function: Get allowed roles for a specific feature
 * @param {string} feature - Feature name (e.g., 'canContribute')
 * @returns {array} - Array of roles that have access
 */
export const getAllowedRolesForFeature = (feature) => {
  return Object.keys(ROLE_PERMISSIONS).filter(
    (role) => ROLE_PERMISSIONS[role][feature] === true
  );
};
