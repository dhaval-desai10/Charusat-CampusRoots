import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import PrivateRoute from '@/components/PrivateRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Posts from '@/pages/Posts';
import Reunions from '@/pages/Reunions';
import Gallery from '@/pages/Gallery';
import Feedback from '@/pages/Feedback';
import Donations from '@/pages/Donations';
import Internships from '@/pages/Internships';
import RBAC from '@/pages/RBAC';

function App() {
   return (
      <BrowserRouter>
         <AuthProvider>
            <Routes>
               <Route path="/login" element={<Login />} />
               <Route
                  path="/"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Dashboard />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/users"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Users />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/posts"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Posts />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/reunions"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Reunions />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/gallery"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Gallery />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/feedback"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Feedback />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/donations"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Donations />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/internships"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <Internships />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route
                  path="/rbac"
                  element={
                     <PrivateRoute>
                        <Layout>
                           <RBAC />
                        </Layout>
                     </PrivateRoute>
                  }
               />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
         </AuthProvider>
      </BrowserRouter>
   );
}

export default App;
