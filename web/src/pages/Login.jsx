import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      try {
        // Exchange Google access token for our app JWT
        const response = await apiClient.post('/auth/google', {
          idToken: tokenResponse.access_token,
        });
        login(response.data.token, response.data.user);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Google Sign-In failed');
      }
    },
    onError: () => setError('Google Sign-In failed. Please try again.'),
  });

  return (
    <main className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Left Side: Shield Graphic & Branding (Desktop) */}
      <section className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-primary-container p-xl">
        {/* Atmospheric Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/5 rounded-full blur-[150px]"></div>
        
        {/* Logo/Shield Area */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="animate-float mb-lg">
            <img 
              alt="TezSend Secure Shield" 
              className="w-64 h-64 object-contain drop-shadow-[0_0_30px_rgba(78,222,163,0.2)]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNK3OB-CH54Om8pzVT_uxG_MBVrqMbdIkp7prRAVDpvk_8Q1aPW38xy6mBLh_LtbYB3dzESm70SEnteC4pTGHJzGHBsFw9kFPreHuSWCkPDPQMexPo-XSa7yKBBGq9gYH2-RTl2ge-fe6GhtFtv_9J74IOutv9KFOqpgHs_OBkKZ9NrbxfJAuez6XlBaMYM-3UZX611Ks72EPTUnEBgkfIJvrI1ZEpo3y4lwpcel4mYD6E_dJlkrf8"
            />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm tracking-tight">
            Institutional Grade <br/><span className="text-secondary">Security.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md opacity-80">
            Experience the next generation of financial transfers with AES-256 encryption and biometric vault protection.
          </p>
        </div>
        
        {/* Animated Tech Grid Background (CSS Pattern) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
      </section>

      {/* Right Side: Authentication Form */}
      <section className="w-full md:w-1/2 flex flex-col items-center justify-center p-md bg-surface relative">
        {/* Mobile Brand Header */}
        <div className="md:hidden flex items-center gap-base mb-lg">
          <img 
            alt="TezSend Logo" 
            className="w-10 h-10" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNK3OB-CH54Om8pzVT_uxG_MBVrqMbdIkp7prRAVDpvk_8Q1aPW38xy6mBLh_LtbYB3dzESm70SEnteC4pTGHJzGHBsFw9kFPreHuSWCkPDPQMexPo-XSa7yKBBGq9gYH2-RTl2ge-fe6GhtFtv_9J74IOutv9KFOqpgHs_OBkKZ9NrbxfJAuez6XlBaMYM-3UZX611Ks72EPTUnEBgkfIJvrI1ZEpo3y4lwpcel4mYD6E_dJlkrf8"
          />
          <span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">TezSend</span>
        </div>

        {/* Login Card */}
        <div className="glass-vault inner-glow rounded-xl p-md md:p-lg w-full max-w-[440px] flex flex-col space-y-md">
          <div className="space-y-xs">
            <h2 className="font-headline-md text-headline-md text-on-surface">Welcome back</h2>
            <p className="font-label-caps text-label-caps text-on-surface-variant">SECURE LOGIN PORTAL</p>
          </div>

          {error && (
            <div className="bg-error-container/20 border border-error/50 text-error px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form className="flex flex-col space-y-md" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="flex flex-col space-y-xs group">
              <label className="font-label-caps text-label-caps text-on-surface-variant px-xs">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-secondary transition-colors">
                  alternate_email
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-lg py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="name@company.com" 
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col space-y-xs group">
              <div className="flex justify-between items-center px-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Password</label>
                <button className="font-label-caps text-label-caps text-secondary hover:opacity-80 transition-opacity" type="button">Forgot?</button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-secondary transition-colors">
                  lock
                </span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-lg py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-on-surface-variant/30" 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              className="bg-secondary text-on-secondary font-headline-md text-[18px] py-4 rounded-lg active:scale-95 transition-all duration-200 emerald-glow mt-sm"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.background = `radial-gradient(circle at ${x}px ${y}px, #6ffbbe 0%, #4edea3 100%)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '';
              }}
            >
              Login to Vault
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-sm py-xs">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <span className="font-label-caps text-label-caps text-on-surface-variant/50">OR CONTINUE WITH</span>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          {/* Google OAuth Button */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-base border border-white/10 py-3 rounded-lg hover:bg-white/5 transition-colors active:scale-95 duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="font-body-md text-body-md text-on-surface">Sign in with Google</span>
          </button>

          {/* Signup Link */}
          <p className="text-center font-body-md text-body-md text-on-surface-variant">
            Don't have a corporate account? <Link className="text-secondary font-semibold hover:underline" to="/register">Register</Link>
          </p>
        </div>

        {/* Security Footer */}
        <footer className="mt-xl flex flex-col items-center space-y-xs opacity-60">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-secondary">encrypted</span>
            <span className="font-label-caps text-label-caps tracking-widest uppercase">256-bit Secure Encrypted Connection</span>
          </div>
          <p className="font-label-caps text-[10px] text-on-surface-variant">Trusted by 10k+ financial institutions worldwide</p>
        </footer>
      </section>
    </main>
  );
};

export default Login;
