// ============================================
// Backend RBAC (Role-Based Access Control) Constants
// ============================================

import {
  ROLES,
  MODULES,
  ASSIGNABLE_ROLES,
  ALL_ROLES,
  ALL_MODULES,
  MODULE_LABELS,
  DEFAULT_ROLE_PERMISSIONS
} from '../constants/rbac.js';

export {
  ROLES,
  MODULES,
  ASSIGNABLE_ROLES,
  ALL_ROLES,
  ALL_MODULES,
  MODULE_LABELS,
  DEFAULT_ROLE_PERMISSIONS
};

/**
 * API Endpoint Access Control
 * Defines which roles can access which endpoints
 */
export const ENDPOINT_ACCESS = {
  // Auth Routes
  '/api/auth/register': ['all'],
  '/api/auth/login': ['all'],
  '/api/auth/me': ['authenticated'],
  '/api/auth/profile': ['authenticated'],
  '/api/auth/logout': ['authenticated'],

  // Posts
  '/api/posts': ['authenticated'],
  '/api/posts/:id/like': ['authenticated'],

  // Donations/Contributions
  '/api/donation/create-payment-intent': ['alumni'],
  '/api/donation/confirm': ['alumni'],
  '/api/donation/my-donations': ['authenticated'],
  '/api/donation/public-donors': ['authenticated'],
  '/api/donation/admin/all': ['admin'],

  // Internships
  '/api/internship': ['alumni'],
  '/api/internship/my': ['alumni'],
  '/api/internship/apply': ['student'],
  '/api/internship/:id/applications': ['alumni'],

  // Feedback
  '/api/feedback': ['alumni'],
  '/api/feedback/public': ['authenticated'],
  '/api/feedback/admin/all': ['admin'],

  // Reunions
  '/api/reunions': ['authenticated'],
  '/api/reunions/propose': ['faculty'],
  '/api/reunions/:id/register': ['alumni'],

  // Admin
  '/api/admin/users': ['admin'],
  '/api/admin/dashboard': ['admin'],
  '/api/admin/posts': ['admin'],
  '/api/admin/reunions': ['admin']
};

/**
 * Feature Availability by Role
 * Centralized business logic access control
 */
export const ROLE_FEATURES = {
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
    canExportData: true,
    canManageDonations: true,
    canBanUsers: true,
    canEditUserRoles: true
  }
};

/**
 * Utility Function: Check if user has permission
 * @param {object} user - User object with role property
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  return ROLE_FEATURES[user.role]?.[permission] === true;
};

/**
 * Utility Function: Check if user is admin
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role === ROLES.ADMIN;
};

/**
 * Utility Function: Check if user is alumni
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user is alumni
 */
export const isAlumni = (user) => {
  return user?.role === ROLES.ALUMNI;
};

/**
 * Utility Function: Check if user is student
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user is student
 */
export const isStudent = (user) => {
  return user?.role === ROLES.STUDENT;
};

/**
 * Utility Function: Check if user is faculty
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user is faculty
 */
export const isFaculty = (user) => {
  return user?.role === ROLES.FACULTY;
};

/**
 * Privacy Check based on User Role
 * Checks if profile is visible based on requester's role
 */
export const canViewProfile = (targetUser, requesterRole) => {
  const visibility = targetUser.privacy?.profileVisibility || 'alumni-only';

  if (visibility === 'public') return true;
  if (visibility === 'private') return false;
  if (visibility === 'alumni-only') return requesterRole === ROLES.ALUMNI;
  if (visibility === 'connections-only') return targetUser.isConnectedTo;

  return false;
};

/**
 * Messaging Permission Check
 * Determines if one user can message another based on privacy settings
 */
export const canMessageUser = (targetUser, requesterRole, isConnected) => {
  const messagingPolicy = targetUser.privacy?.allowMessaging || 'alumni-only';

  if (messagingPolicy === 'everyone') return true;
  if (messagingPolicy === 'none') return false;
  if (messagingPolicy === 'alumni-only') return requesterRole === ROLES.ALUMNI;
  if (messagingPolicy === 'connections-only') return isConnected;

  return false;
};

/**
 * Get Role Label (human-readable)
 * @param {string} role - Role key
 * @returns {string} - Human-readable role name
 */
export const getRoleLabel = (role) => {
  const labels = {
    student: 'Student',
    alumni: 'Alumni',
    faculty: 'Faculty',
    admin: 'Administrator'
  };
  return labels[role] || role;
};

/**
 * Validate if role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} - True if role is valid
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};
