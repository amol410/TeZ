import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to initialize the auth state on load
  const loadUser = async () => {
    const token = localStorage.getItem('tezsend_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // If token exists, fetch the user profile
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Token might be invalid or expired
      localStorage.removeItem('tezsend_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Function to log in and save token
  const login = async (token, userData) => {
    localStorage.setItem('tezsend_token', token);
    setUser(userData);
  };

  // Function to log out
  const logout = () => {
    localStorage.removeItem('tezsend_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
