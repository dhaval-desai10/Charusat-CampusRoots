import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
   const [admin, setAdmin] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      checkAuth();
   }, []);

   const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
         setLoading(false);
         return;
      }

      try {
         const response = await api.get('/verify');
         if (response.data.success) {
            setAdmin(response.data.admin);
         }
      } catch (error) {
         localStorage.removeItem('adminToken');
      } finally {
         setLoading(false);
      }
   };

   const login = async (username, password) => {
      const response = await api.post('/login', { username, password });
      if (response.data.success) {
         localStorage.setItem('adminToken', response.data.token);
         setAdmin(response.data.admin);
         return { success: true };
      }
      return { success: false, message: response.data.message };
   };

   const logout = () => {
      localStorage.removeItem('adminToken');
      setAdmin(null);
   };

   return (
      <AuthContext.Provider value={{ admin, loading, login, logout, checkAuth }}>
         {children}
      </AuthContext.Provider>
   );
}

export function useAuth() {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
}
