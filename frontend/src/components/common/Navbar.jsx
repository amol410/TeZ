import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import {
  BookOpen, Video, Brain, Layers, Home, LogOut, User,
  Menu, X, ChevronDown, Zap, ShieldCheck, ShoppingCart, GraduationCap
} from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/courses', icon: GraduationCap, label: 'Courses' },
    { to: '/notes', icon: BookOpen, label: 'Notes' },
    { to: '/videos', icon: Video, label: 'Videos' },
    { to: '/quizzes', icon: Brain, label: 'Quizzes' },
    { to: '/flashcards', icon: Layers, label: 'Flashcards' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card mx-4 mt-3 rounded-2xl border border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-lg shadow-dolphin-900/30 group-hover:shadow-dolphin-700/40 transition-all duration-300">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-base leading-none block">TezSend</span>
                <span className="text-gray-500 text-xs">LMS Platform</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-dolphin-600/30 text-dolphin-300 border border-dolphin-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/8'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-orange-600/30 text-orange-300 border border-orange-500/30'
                        : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                    )
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </NavLink>
              )}
            </div>

            {/* Profile & Cart */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition-all duration-200">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center -mt-1 -mr-1">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/8 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium leading-none">{user?.name?.split(' ')[0]}</p>
                    <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
                  </div>
                  <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform duration-200', profileOpen && 'rotate-180')} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-card border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/8 transition-colors text-sm"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors text-sm"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden btn-icon"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1 animate-slide-up">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-dolphin-600/30 text-dolphin-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/8'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'bg-orange-600/30 text-orange-300' : 'text-orange-400 hover:bg-orange-500/10'
                  )
                }
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </NavLink>
            )}
            <NavLink
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive ? 'bg-dolphin-600/30 text-dolphin-300' : 'text-gray-400 hover:text-white hover:bg-white/8'
                )
              }
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" />
                Cart
              </div>
              {cartCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </NavLink>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
