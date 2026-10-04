import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import PrivateRoute from './components/PrivateRoute';
import PermissionRoute from './components/PermissionRoute';
import { MODULES } from './constants/rbac.js';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import Flashback from './pages/Flashback';
import Settings from './pages/Settings';
import Network from './pages/Network';
import Chat from './pages/Chat';
import UserProfile from './pages/UserProfile';
import Feed from './pages/Feed';
import Reunions from './pages/Reunions';
import Gallery from './pages/Gallery';
import Feedback from './pages/Feedback';
import Donation from './pages/Donation';
import Internships from './pages/Internships';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PermissionProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/complete-profile"
                element={
                  <PrivateRoute>
                    <CompleteProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/flashback"
                element={
                  <PrivateRoute>
                    <Flashback />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/network"
                element={
                  <PrivateRoute>
                    <Network />
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <PrivateRoute>
                    <PermissionRoute module={MODULES.FEED}>
                      <Feed />
                    </PermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reunions"
                element={
                  <PrivateRoute>
                    <PermissionRoute module={MODULES.REUNION}>
                      <Reunions />
                    </PermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/gallery"
                element={
                  <PrivateRoute>
                    <PermissionRoute module={MODULES.GALLERY}>
                      <Gallery />
                    </PermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <PrivateRoute>
                    <Feedback />
                  </PrivateRoute>
                }
              />
              <Route
                path="/donation"
                element={
                  <PrivateRoute>
                    <PermissionRoute module={MODULES.CONTRIBUTION}>
                      <Donation />
                    </PermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/internships"
                element={
                  <PrivateRoute>
                    <PermissionRoute module={MODULES.INTERNSHIP}>
                      <Internships />
                    </PermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/flashback" replace />} />
              <Route path="*" element={<Navigate to="/flashback" replace />} />
            </Routes>
          </Router>
        </PermissionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
