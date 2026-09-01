import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Numbers from './pages/Numbers/Numbers';
import Packages from './pages/Packages/Packages';
import Logs from './pages/Logs/Logs';
import SendWhatsApp from './pages/Send/SendWhatsApp';
import TemplateLibrary from './pages/TemplateLibrary/TemplateLibrary';
import Templates from './pages/Templates/Templates';
import ApiSettings from './pages/Settings/ApiSettings';
import WebhookConfig from './pages/Settings/WebhookConfig';
import OptoutRules from './pages/Settings/OptoutRules';
import Blacklist from './pages/Settings/Blacklist';
import Support from './pages/Settings/Support';
import Wallet from './pages/Wallet/Wallet';
import Profile from './pages/Profile/Profile';
import AutoReplies from './pages/AutoReplies/AutoReplies';

import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import ApiLogs from './pages/Admin/ApiLogs';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { token, user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  if (requireAdmin && user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Client Routes (Also contains Admin sub-routes now) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="send" element={<SendWhatsApp />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="numbers" element={<Numbers />} />
              <Route path="templates" element={<Templates />} />
              <Route path="library" element={<TemplateLibrary />} />
              <Route path="logs" element={<Logs />} />
              <Route path="auto-replies" element={<AutoReplies />} />

              {/* Admin specific sub-routes */}
              <Route path="users" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="packages" element={
                <ProtectedRoute requireAdmin>
                  <Packages />
                </ProtectedRoute>
              } />
              <Route path="api-logs" element={
                <ProtectedRoute requireAdmin>
                  <ApiLogs />
                </ProtectedRoute>
              } />

              {/* Settings */}
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<ApiSettings />} />
              <Route path="webhook" element={<WebhookConfig />} />
              <Route path="optout" element={<OptoutRules />} />
              <Route path="blacklist" element={<Blacklist />} />
              <Route path="support" element={<Support />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
