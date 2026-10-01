import RolePermission from '../models/RolePermission.js';
import { ROLES } from '../constants/rbac.js';

/**
 * Middleware factory that checks if the authenticated user's role
 * has permission to access the given module.
 *
 * Usage:  router.use(requirePermission('reunion'));
 *
 * - Admin role bypasses all RBAC checks.
 * - Missing or unknown permission → denied (fail-safe).
 */
export const requirePermission = (moduleName) => {
   return async (req, res, next) => {
      try {
         // Must be authenticated (Passport session populates req.user)
         if (!req.user) {
            return res.status(401).json({
               success: false,
               message: 'Unauthorized. Please login first.'
            });
         }

         const userRole = req.user.role;

         // Admin bypasses RBAC
         if (userRole === ROLES.ADMIN) {
            return next();
         }

         // Look up persisted permission
         const permission = await RolePermission.findOne({
            role: userRole,
            module: moduleName
         });

         // Fail-safe: if no record found or not enabled → deny
         if (!permission || !permission.enabled) {
            return res.status(403).json({
               success: false,
               message: `Access denied. Your role does not have permission to access ${moduleName}.`
            });
         }

         next();
      } catch (error) {
         console.error('RBAC Middleware Error:', error);
         res.status(500).json({
            success: false,
            message: 'Permission check failed'
         });
      }
   };
};
