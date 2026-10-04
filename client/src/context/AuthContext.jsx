import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
};

const API_URL = 'http://localhost:5000';

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      checkAuth();
   }, []);

   const checkAuth = async () => {
      try {
         const response = await axios.get(`${API_URL}/api/auth/me`);
         if (response.data.success) {
            setUser(response.data.user);
         }
      } catch (error) {
         setUser(null);
      } finally {
         setLoading(false);
      }
   };

   // Register with email/password
   const register = async (formData) => {
      try {
         const response = await axios.post(`${API_URL}/api/auth/register`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data'
            }
         });
         if (response.data.success) {
            setUser(response.data.user);
            return { success: true };
         }
         return { success: false, error: response.data.message };
      } catch (error) {
         return { 
            success: false, 
            error: error.response?.data?.message || 'Registration failed' 
         };
      }
   };

   // Login with email/password
   const login = async (email, password) => {
      try {
         const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
         if (response.data.success) {
            setUser(response.data.user);
            return { success: true };
         }
         return { success: false, error: response.data.message };
      } catch (error) {
         return { 
            success: false, 
            error: error.response?.data?.message || 'Login failed' 
         };
      }
   };

   const loginWithGoogle = () => {
      window.location.href = `${API_URL}/api/auth/google`;
   };

   const logout = async () => {
      try {
         await axios.get(`${API_URL}/api/auth/logout`);
         setUser(null);
      } catch (error) {
         console.error('Logout failed:', error);
      }
   };

   const updateProfile = async (profileData) => {
      try {
         const response = await axios.put(`${API_URL}/api/auth/profile`, profileData);
         if (response.data.success) {
            setUser(response.data.user);
            return { success: true };
         }
      } catch (error) {
         return { success: false, error: error.response?.data?.message || 'Update failed' };
      }
   };

   return (
      <AuthContext.Provider value={{ 
         user,
         setUser,
         loading,
         register,
         login,
         loginWithGoogle, 
         logout, 
         updateProfile,
         refreshUser: checkAuth
      }}>
         {children}
      </AuthContext.Provider>
   );
};
