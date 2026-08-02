import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Lock, User, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import api, { setAuthToken } from '../api';

// Authentication UI uses server endpoints for Google and email flows.

export default function AuthPage() {
  // No phone auth on frontend — only Google and email/password
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'phone'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Email Auth State
  const [formData, setFormData] = useState({
    name: '', email: '', password: ''
  });

  // No recaptcha or phone setup

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (authMode === 'login') {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        setAuthToken(res.data.token);
        navigate('/');
      } else if (authMode === 'signup') {
        const res = await api.post('/auth/register', formData);
        setAuthToken(res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // First attempt: send Google ID token directly to backend (/auth/google)
      const res = await api.post('/auth/google', { idToken: credentialResponse.credential });
      setAuthToken(res.data.token);
      navigate('/');
      return;
    } catch (err) {
      setError('Google Sign-In failed.');
      // If direct Google token exchange fails (invalid_client), fallback to
      // signing in with Firebase using the credential and send a Firebase ID
      // token to the backend (/auth/firebase-google).
      console.warn('Direct Google exchange failed, attempting Firebase fallback', err?.response?.data || err);
    }

    try {
      const googleIdToken = credentialResponse.credential;
      const firebaseCred = GoogleAuthProvider.credential(googleIdToken);
      const userCred = await signInWithCredential(auth, firebaseCred);
      const firebaseIdToken = await userCred.user.getIdToken();
      const res2 = await api.post('/auth/firebase-google', { idToken: firebaseIdToken });
      setAuthToken(res2.data.token);
      navigate('/');
    } catch (err) {
      console.error('Firebase fallback for Google sign-in failed', err);
      setError('Google Sign-In failed.');
    }
  };

  // phone/OTP handlers removed


  return (
    <div className="auth-page fade-in">
      
      {/* Brand Side */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="logo-icon"><Send size={24} color="var(--brand)" /></div>
          <span className="logo-text gradient-text">TezSend</span>
        </div>
        
        <div style={{ zIndex: 1 }}>
          <h2 className="auth-brand-tagline" style={{ marginBottom: '2rem' }}>
            Pay your rent,<br/><span>earn rewards.</span>
          </h2>
          <ul className="auth-brand-features">
            <li>
              <div className="feat-icon"><Send size={16} color="var(--brand)" /></div>
              Instant transfer to any UPI or Bank
            </li>
            <li>
              <div className="feat-icon"><Lock size={16} color="var(--brand)" /></div>
              Bank-grade security & encryption
            </li>
            <li>
              <div className="feat-icon"><User size={16} color="var(--brand)" /></div>
              Low 2% convenience fee
            </li>
          </ul>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-box">
          <div className="auth-tabs">
            <button className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => { setAuthMode('login'); }}>Login</button>
            <button className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => { setAuthMode('signup'); }}>Sign Up</button>
          </div>

          <h2 style={{ marginBottom: '1.5rem' }}>
            {authMode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>

          {error && (
            <div className="error-msg flex-row">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {authMode !== 'phone' && (
            <>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-In was unsuccessful')}
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  width="100%"
                />
              </div>

              <div className="divider">or continue with email</div>

              <form onSubmit={handleEmailSubmit}>
                {authMode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="name" className="form-input" placeholder="John Doe" required onChange={handleChange} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="form-input" placeholder="you@example.com" required onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" className="form-input" placeholder="••••••••" required onChange={handleChange} />
                </div>

                <button type="submit" className="btn btn-primary btn-full mt-1">
                  {authMode === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </form>
            </>
          )}

          {/* Phone UI removed from frontend */}

        </div>
      </div>
    </div>
  );
}
