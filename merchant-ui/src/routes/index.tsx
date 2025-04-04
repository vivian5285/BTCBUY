import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import ProductList from '../pages/ProductList';
import ProductEdit from '../pages/ProductEdit';
import OrderList from '../pages/OrderList';
import OrderDetail from '../pages/OrderDetail';
import CouponStatistics from '../pages/CouponStatistics';
import CouponUsage from '../pages/CouponUsage';
import SendCoupons from '../pages/SendCoupons';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductList />
          </PrivateRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <PrivateRoute>
            <ProductEdit />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <PrivateRoute>
            <OrderList />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <PrivateRoute>
            <OrderDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/coupons/statistics"
        element={
          <PrivateRoute>
            <CouponStatistics />
          </PrivateRoute>
        }
      />
      <Route
        path="/coupons/usage"
        element={
          <PrivateRoute>
            <CouponUsage />
          </PrivateRoute>
        }
      />
      <Route
        path="/coupons/send"
        element={
          <PrivateRoute>
            <SendCoupons />
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
    </Routes>
  );
};

export default AppRoutes; 