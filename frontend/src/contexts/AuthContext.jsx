import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const TOKEN_KEY = 'lms_tezsend_token';
const USER_KEY  = 'lms_tezsend_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // ─── Restore session from token on mount ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !user) {
      api.get('/lms-auth/me').then(({ data }) => {
        const userData = data.user ?? data;
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      }).catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAuth = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  // ─── Register with Email ─────────────────────────────────────────────────────
  const registerWithEmail = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/lms-auth/register', { name, email, password });
      saveAuth(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}! 🎓`);
      return { success: true, user: data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Login with Email ────────────────────────────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/lms-auth/login', { email, password });
      saveAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Google Login ────────────────────────────────────────────────────────────
  // Called with the Google access_token from @react-oauth/google
  const loginWithGoogle = useCallback(async (accessToken) => {
    setLoading(true);
    try {
      const { data } = await api.post('/lms-auth/google', { idToken: accessToken });
      saveAuth(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}! 🎓`);
      return { success: true, user: data.user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Google Sign-In failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, registerWithEmail, loginWithEmail, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
