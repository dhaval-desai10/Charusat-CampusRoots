import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';

/**
 * Route guard that checks RBAC permission for a module.
 * If permission is denied, redirects to /flashback (app landing page).
 * Shows loading spinner while permissions are being fetched.
 * 
 * Usage:
 *   <PermissionRoute module="reunion">
 *     <Reunions />
 *   </PermissionRoute>
 */
const PermissionRoute = ({ module, children }) => {
   const { user, loading: authLoading } = useAuth();
   const { hasPermission, permissionsLoaded } = usePermissions();

   // Wait for auth to resolve
   if (authLoading) {
      return (
         <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-blue)]"></div>
         </div>
      );
   }

   // Not authenticated → handled by PrivateRoute
   if (!user) {
      return <Navigate to="/login" />;
   }

   // Wait for permissions to load
   if (!permissionsLoaded) {
      return (
         <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-blue)]"></div>
         </div>
      );
   }

   // Check permission
   if (!hasPermission(module)) {
      return <Navigate to="/flashback" replace />;
   }

   return children;
};

export default PermissionRoute;
