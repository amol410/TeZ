import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const { loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      const result = await loginWithGoogle(tokenResponse.access_token);
      if (result.success) {
        navigate('/dashboard');
      }
    },
    onError: () => setError('Google Sign-In failed. Please try again.'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-dolphin-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-ocean-600/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-xl shadow-dolphin-900/40 mb-5">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">TezSend LMS</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Sign in with your Google account to continue
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 gradient-border">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-7">
            {['Notes', 'Videos', 'Quizzes', 'Flashcards'].map(f => (
              <span key={f} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-dolphin-400" />
                {f}
              </span>
            ))}
          </div>

          {/* Google Sign-In Button */}
          <button
            id="google-signin-btn"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-gray-600 text-xs mt-6">
            By signing in you agree to TezSend's Terms of Service.
            <br />
            New users are assigned the <strong className="text-gray-400">Student</strong> role by default.
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6 flex items-center justify-center gap-1">
          <BookOpen className="w-3 h-3" />
          TezSend Learning Management System • tezsend.com
        </p>
      </div>
    </div>
  );
}
