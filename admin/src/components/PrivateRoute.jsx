import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PrivateRoute({ children }) {
   const { admin, loading } = useAuth();

   if (loading) {
      return (
         <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         </div>
      );
   }

   if (!admin) {
      return <Navigate to="/login" replace />;
   }

   return children;
}
