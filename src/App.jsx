import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Numbers from './pages/Numbers/Numbers';
import Packages from './pages/Packages/Packages';
import Logs from './pages/Logs/Logs';
import TemplateLibrary from './pages/TemplateLibrary/TemplateLibrary';
import Templates from './pages/Templates/Templates';
import ApiSettings from './pages/Settings/ApiSettings';
import WebhookConfig from './pages/Settings/WebhookConfig';
import OptoutRules from './pages/Settings/OptoutRules';
import Blacklist from './pages/Settings/Blacklist';
import Support from './pages/Settings/Support';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="numbers" element={<Numbers />} />
            <Route path="templates" element={<Templates />} />
            <Route path="library" element={<TemplateLibrary />} />
            <Route path="logs" element={<Logs />} />
            <Route path="packages" element={<Packages />} />

            {/* Settings */}
            <Route path="settings" element={<ApiSettings />} />
            <Route path="webhook" element={<WebhookConfig />} />
            <Route path="optout" element={<OptoutRules />} />
            <Route path="blacklist" element={<Blacklist />} />
            <Route path="support" element={<Support />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
