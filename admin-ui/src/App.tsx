import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { themeConfig } from './theme';
import Layout from './components/Layout';
import AdminNotification from './pages/AdminNotification';
import AdminMerchant from './pages/AdminMerchant';
import AdminCommission from './pages/AdminCommission';
import AdminWithdrawal from './pages/AdminWithdrawal';
import SecurityDashboard from './pages/SecurityDashboard';
import SecurityConfig from './pages/SecurityConfig';
import AlertRules from './pages/AlertRules';
import NotificationBell from './components/NotificationBell';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  return (
    <ConfigProvider theme={themeConfig}>
      <Router>
        <Layout>
          <Navbar>
            <NotificationBell />
          </Navbar>
          <Routes>
            <Route path="/notifications" element={<AdminNotification />} />
            <Route path="/merchants" element={<AdminMerchant />} />
            <Route path="/commission" element={<AdminCommission />} />
            <Route path="/withdrawals" element={<AdminWithdrawal />} />
            <Route path="/security">
              <Route index element={<SecurityDashboard />} />
              <Route path="config" element={<SecurityConfig />} />
              <Route path="alert-rules" element={<AlertRules />} />
            </Route>
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App; 