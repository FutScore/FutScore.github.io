import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Navbar from './components/Navbar';
import AppBackground from './components/AppBackground';
import Login from './pages/Login';
import Register from './pages/Register';
import OrderForm from './pages/OrderForm';
import Cart from './pages/Cart';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from './store/slices/authSlice';
import { jwtDecode } from 'jwt-decode';
import { RootState } from './store';
import axios from 'axios';
import { API_BASE_URL } from './api';
import theme from './theme';
import Footer from './components/Footer';
import ChangePassword from './pages/ChangePassword';
import Store from './pages/Store';
import Addresses from './pages/Addresses';
import PaymentMethods from './pages/PaymentMethods';
import PreviousOrders from './components/PreviousOrders';
import UserPanel from './pages/UserPanel';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const PasswordResetRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (user?.password_reset_required) {
    if (location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  }

  return children;
};

const AppLayout = () => {
  return (
    <PasswordResetRoute>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/store" replace />} />
            <Route path="/store" element={<Store />} />
            <Route path="/order" element={<PrivateRoute><OrderForm /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/moradas" element={<PrivateRoute><Addresses /></PrivateRoute>} />
            <Route path="/payment-methods" element={<PrivateRoute><PaymentMethods /></PrivateRoute>} />
            <Route path="/previous-orders" element={<PrivateRoute><PreviousOrders /></PrivateRoute>} />
            <Route path="/user-panel" element={<PrivateRoute><UserPanel /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </PasswordResetRoute>
  );
};

function useAuthRestore() {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (typeof decoded === 'object' && decoded && 'exp' in decoded) {
          if (((decoded as { exp: number }).exp * 1000) < Date.now()) {
            localStorage.removeItem('token');
            return;
          }
        }
        // First, set what we have from the token so the app renders quickly
        const baseUser: any = { ...decoded, token };
        dispatch(setUser(baseUser));

        // Then, enrich from backend to restore fields not present in the token
        const userId = (decoded as any)?.id;
        if (userId) {
          axios
            .get(`${API_BASE_URL}/.netlify/functions/getusers?userId=${userId}`)
            .then((res) => {
              const data = res?.data;
              // Handle both array response and single object
              const profile = Array.isArray(data) ? data[0] : data;
              if (profile) {
                dispatch(setUser({ ...baseUser, ...profile, token }));
              }
            })
            .catch(() => {
              // ignore profile load errors; keep token-based user
            });
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, [dispatch]);
}

function App() {
  useAuthRestore();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBackground />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
