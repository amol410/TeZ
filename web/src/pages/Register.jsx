import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const termsChecked = e.target.terms.checked;
    if (!termsChecked) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        login(response.data.token, response.data.user);
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen w-full">
      <style>{`
        .btn-glow:hover {
            box-shadow: 0 0 20px rgba(78, 222, 163, 0.3);
        }
        .shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
            background-size: 200% 100%;
            animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
      `}</style>
      
      {/* Left Section: Brand & Trust */}
      <section className="relative hidden md:flex w-full md:w-1/2 flex-col items-center justify-center p-md md:p-xl overflow-hidden bg-primary-container">
          {/* Atmospheric Layer */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[120px]"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-tertiary/5 blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-md text-center md:text-left flex flex-col items-center md:items-start">
              {/* Brand Logo */}
              <div className="mb-lg">
                  <img alt="TezSend Logo" className="w-24 h-24 md:w-32 md:h-32 mb-6" src="https://lh3.googleusercontent.com/aida/AP1WRLsm4CeKkmvpHQboTmD81T8f_I5tg92u5EpYjzeH2dn2icEHzL0vr5LKCYYrKs_Jvt9FiXsLsdFK5hEJrASNlWmCibfmeLSMZRME2MdU0RMtSgGDnRc66AB25VHbrP9Na406paTqNbl_A7JbF327T393Ck02C6Jszzpsg9Mo8Ldo3R0K95vWev66Z2M-WkOvhQuPkaeUbBn8Snye0iaBkoP2QRTVaioZQOjT4PjzLaZTti8ycCp55LvFSw" />
              </div>
              
              {/* Trust Message */}
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-md">
                  Join the next generation of <span className="text-secondary">secure transfer</span>.
              </h1>
              <p className="font-body-lg text-body-lg text-on-primary-container mb-lg max-w-sm">
                  Experience institutional-grade financial infrastructure designed for speed, security, and global scale.
              </p>
              
              {/* Trust Graphic (Abstract Data Visual) */}
              <div className="w-full h-48 glass-vault rounded-xl p-md flex items-center justify-around gap-2 relative overflow-hidden">
                  <div className="shimmer absolute inset-0"></div>
                  <div className="flex flex-col items-center gap-2 relative z-10">
                      <span className="material-symbols-outlined text-secondary text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>encrypted</span>
                      <span className="font-label-caps text-label-caps text-secondary">ENCRYPTED</span>
                  </div>
                  <div className="h-12 w-[1px] bg-white/10 relative z-10"></div>
                  <div className="flex flex-col items-center gap-2 relative z-10">
                      <span className="material-symbols-outlined text-secondary text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
                      <span className="font-label-caps text-label-caps text-secondary">VERIFIED</span>
                  </div>
                  <div className="h-12 w-[1px] bg-white/10 relative z-10"></div>
                  <div className="flex flex-col items-center gap-2 relative z-10">
                      <span className="material-symbols-outlined text-secondary text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>account_balance</span>
                      <span className="font-label-caps text-label-caps text-secondary">CUSTODIAL</span>
                  </div>
              </div>
          </div>
      </section>

      {/* Right Section: Registration Form */}
      <section className="w-full md:w-1/2 flex items-center justify-center p-md md:p-xl bg-surface-dim">
          <div className="w-full max-w-[480px]">
              
              {/* Mobile Header logic */}
              <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
                  <img alt="TezSend Logo" className="w-12 h-12" src="https://lh3.googleusercontent.com/aida/AP1WRLsm4CeKkmvpHQboTmD81T8f_I5tg92u5EpYjzeH2dn2icEHzL0vr5LKCYYrKs_Jvt9FiXsLsdFK5hEJrASNlWmCibfmeLSMZRME2MdU0RMtSgGDnRc66AB25VHbrP9Na406paTqNbl_A7JbF327T393Ck02C6Jszzpsg9Mo8Ldo3R0K95vWev66Z2M-WkOvhQuPkaeUbBn8Snye0iaBkoP2QRTVaioZQOjT4PjzLaZTti8ycCp55LvFSw" />
                  <span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">TezSend</span>
              </div>

              {/* Registration Card */}
              <div className="glass-vault p-lg md:p-xl rounded-xl">
                  <div className="mb-lg">
                      <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Create your account</h2>
                      <p className="font-body-md text-body-md text-on-surface-variant">Get started with your secure banking portal.</p>
                  </div>
                  
                  {error && (
                    <div className="bg-error-container/20 border border-error/50 text-error px-4 py-3 rounded-lg text-sm font-medium mb-4">
                      {error}
                    </div>
                  )}

                  <form className="space-y-md" onSubmit={handleRegister}>
                      {/* Full Name */}
                      <div className="space-y-xs">
                          <label className="font-label-caps text-label-caps text-on-surface-variant px-1" htmlFor="name">FULL NAME</label>
                          <div className="relative group">
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary-container group-focus-within:text-secondary transition-colors">person</span>
                              <input 
                                className="w-full bg-surface-container-lowest border border-white/5 rounded-lg py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-body-md" 
                                id="name" 
                                placeholder="John Doe" 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                              />
                          </div>
                      </div>
                      
                      {/* Email Address */}
                      <div className="space-y-xs">
                          <label className="font-label-caps text-label-caps text-on-surface-variant px-1" htmlFor="email">EMAIL ADDRESS</label>
                          <div className="relative group">
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary-container group-focus-within:text-secondary transition-colors">email</span>
                              <input 
                                className="w-full bg-surface-container-lowest border border-white/5 rounded-lg py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-body-md" 
                                id="email" 
                                placeholder="john@corporate.com" 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                          </div>
                      </div>
                      
                      {/* Grid for Passwords */}
                      <div className="grid grid-cols-1 gap-md space-y-md">
                          {/* Create Password */}
                          <div className="space-y-xs">
                              <label className="font-label-caps text-label-caps text-on-surface-variant px-1" htmlFor="password">CREATE PASSWORD</label>
                              <div className="relative group">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary-container group-focus-within:text-secondary transition-colors">lock</span>
                                  <input 
                                    className="w-full bg-surface-container-lowest border border-white/5 rounded-lg py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-body-md" 
                                    id="password" 
                                    placeholder="••••••••" 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                  />
                              </div>
                          </div>
                          
                          {/* Confirm Password */}
                          <div className="space-y-xs">
                              <label className="font-label-caps text-label-caps text-on-surface-variant px-1" htmlFor="confirm_password">CONFIRM PASSWORD</label>
                              <div className="relative group">
                                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary-container group-focus-within:text-secondary transition-colors">lock_person</span>
                                  <input 
                                    className="w-full bg-surface-container-lowest border border-white/5 rounded-lg py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-body-md" 
                                    id="confirm_password" 
                                    placeholder="••••••••" 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                  />
                              </div>
                          </div>
                      </div>
                      
                      {/* Terms */}
                      <div className="flex items-center gap-3 py-2">
                          <input 
                            className="w-4 h-4 rounded bg-surface-container-lowest border-white/10 text-secondary focus:ring-secondary/20" 
                            id="terms" 
                            type="checkbox" 
                            required
                          />
                          <label className="font-body-md text-on-surface-variant text-sm" htmlFor="terms">
                              I agree to the <a className="text-secondary hover:underline" href="#">Terms of Service</a> and <a className="text-secondary hover:underline" href="#">Privacy Policy</a>.
                          </label>
                      </div>
                      
                      {/* Create Account Button */}
                      <button 
                        className={`w-full font-headline-md text-headline-md py-4 rounded-xl btn-glow transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center ${success ? 'bg-tertiary-fixed text-on-secondary' : 'bg-secondary text-on-secondary'}`}
                        type="submit"
                        disabled={loading || success}
                      >
                          {loading ? (
                              <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          ) : success ? (
                              'Account Created'
                          ) : (
                              'Create Account'
                          )}
                      </button>
                  </form>
                  
                  {/* Footnotes */}
                  <div className="mt-lg pt-lg border-t border-white/5 space-y-md text-center">
                      <p className="font-body-md text-body-md text-on-surface-variant">
                          Already have a corporate account? <Link className="text-secondary font-semibold hover:underline" to="/login">Login</Link>
                      </p>
                      <div className="flex items-center justify-center gap-2 opacity-50">
                          <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'wght' 700"}}>lock</span>
                          <p className="font-label-caps text-label-caps tracking-[0.2em]">256-BIT SECURE ENCRYPTED CONNECTION</p>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Bloom effect simulation for success state */}
          {success && (
            <div className="fixed inset-0 bg-secondary pointer-events-none z-[100] opacity-10 transition-opacity duration-1000"></div>
          )}
      </section>
    </main>
  );
};

export default Register;
