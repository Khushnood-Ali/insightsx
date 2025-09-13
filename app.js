import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import axios from 'axios';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    const tenantsData = localStorage.getItem('tenants');
    const selectedTenantId = localStorage.getItem('selectedTenant');

    if (token && userData) {
      try {
        // Set axios default header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setIsAuthenticated(true);
        setUser(JSON.parse(userData));

        const parsedTenants = JSON.parse(tenantsData) || [];
        setTenants(parsedTenants);

        if (selectedTenantId) {
          setSelectedTenant(selectedTenantId);
        } else if (parsedTenants.length > 0) {
          setSelectedTenant(parsedTenants[0].id);
          localStorage.setItem('selectedTenant', parsedTenants[0].id);
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        handleLogout();
      }
    }
    setLoading(false);
  };

  const handleLogin = (authData) => {
    // Set axios default header immediately
    axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;

    setIsAuthenticated(true);
    setUser(authData.user);
    setTenants(authData.tenants || []);

    // Always save auth data regardless of tenants
    console.log("atoken", authData.token);
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('tenants', JSON.stringify(authData.tenants || []));

    if (authData.tenants && authData.tenants.length > 0) {
      setSelectedTenant(authData.tenants[0].id);
      localStorage.setItem('selectedTenant', authData.tenants[0].id);
    }
  };

  const handleLogout = () => {
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenants');
    localStorage.removeItem('selectedTenant');

    setIsAuthenticated(false);
    setUser(null);
    setTenants([]);
    setSelectedTenant(null);
  };

  // Add axios interceptor for handling auth errors globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication error, logging out...');
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthPage onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <Dashboard 
                  tenantId={selectedTenant} 
                  user={user}
                  tenants={tenants}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;