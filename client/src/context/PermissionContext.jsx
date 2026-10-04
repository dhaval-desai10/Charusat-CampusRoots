import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const PermissionContext = createContext();

const API_URL = 'http://localhost:5000';

axios.defaults.withCredentials = true;

export const usePermissions = () => {
   const context = useContext(PermissionContext);
   if (!context) {
      throw new Error('usePermissions must be used within a PermissionProvider');
   }
   return context;
};

export const PermissionProvider = ({ children }) => {
   const { user } = useAuth();
   const [permissions, setPermissions] = useState({});
   const [permissionsLoaded, setPermissionsLoaded] = useState(false);

   const fetchPermissions = useCallback(async () => {
      if (!user) {
         setPermissions({});
         setPermissionsLoaded(true);
         return;
      }

      try {
         const response = await axios.get(`${API_URL}/api/auth/permissions`, {
            withCredentials: true
         });
         if (response.data.success) {
            setPermissions(response.data.permissions);
         }
      } catch (error) {
         console.error('Failed to fetch permissions:', error);
         // Fail-safe: empty permissions means no access
         setPermissions({});
      } finally {
         setPermissionsLoaded(true);
      }
   }, [user]);

   // Fetch permissions when user changes (login/logout)
   useEffect(() => {
      setPermissionsLoaded(false);
      fetchPermissions();
   }, [fetchPermissions]);

   // Re-fetch permissions when page becomes visible (handles admin changes)
   useEffect(() => {
      const handleVisibilityChange = () => {
         if (document.visibilityState === 'visible' && user) {
            fetchPermissions();
         }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
   }, [user, fetchPermissions]);

   /**
    * Check if the current user has permission to access a module.
    * Returns false for unknown/missing permissions (fail-safe).
    * Admin users always have access (handled by backend returning all true).
    */
   const hasPermission = useCallback((moduleName) => {
      // If permissions haven't loaded yet, deny by default
      if (!permissionsLoaded) return false;
      // Explicit check: only grant if explicitly true
      return permissions[moduleName] === true;
   }, [permissions, permissionsLoaded]);

   return (
      <PermissionContext.Provider value={{
         permissions,
         permissionsLoaded,
         hasPermission,
         refreshPermissions: fetchPermissions
      }}>
         {children}
      </PermissionContext.Provider>
   );
};
