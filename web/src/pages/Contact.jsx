import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarUrl = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDQxtbCJxXc27ZgQdthtdHYXWpMn48dEVYRtvKejG1LslF0U1fLfcMxHOjUDqPRiMaOkGTa8boncFMhYBZUMPFJYaYyfMQoPMpg9ggvEW4-rNIt-2k3PvwnuoVd3fnZnRmF6LM2Kw5CytiIra9FWDyHWMAAYY8-7IboxHpRMEaBeN2tofL_IxouVIjNftDhrKbp1IbJNvKxk-PQzqFApRz2Q_9kaK04rw3NyC1XFlBEK-9MqV6yrTLs";

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-lg fixed top-0 w-full z-50 border-b border-white/10 shadow-sm">
        <div className="flex justify-between items-center px-md py-sm w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-base">
            <span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">TezSend</span>
          </div>
          <div className="hidden md:flex items-center gap-lg">
            <nav className="flex gap-md">
              <Link to="/" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">Home</Link>
              <Link to="/send-money" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">Pay</Link>
              <Link to="/history" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">History</Link>
              <Link to="/about" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">About Us</Link>
              <Link to="/contact" className="text-secondary font-bold font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">Contact Us</Link>
            </nav>
          </div>
          <div className="flex items-center gap-md">
            <button className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity duration-200 active:scale-95 transition-transform" aria-label="Notifications">notifications</button>
            <button onClick={handleLogout} className="material-symbols-outlined text-error hover:opacity-80 transition-opacity duration-200 active:scale-95 transition-transform" aria-label="Logout" title="Logout">logout</button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-secondary/30 ring-2 ring-secondary/10">
              <img className="w-full h-full object-cover" alt="User Avatar" src={avatarUrl} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 px-md max-w-4xl mx-auto pb-32">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-secondary hover:underline font-semibold mb-6">
            <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
            Back to Dashboard
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">Contact Support</h1>
          <p className="text-on-surface-variant text-lg">
            We are here to help! If you have any questions, payment issues, or require support regarding your KYC verification, please reach out to us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Support */}
          <div className="bg-surface-container-low/50 border border-white/5 rounded-2xl p-8 hover:bg-surface-container transition-all">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Email Us</h3>
            <p className="text-on-surface-variant mb-6 flex-grow">
              For general inquiries, account assistance, or dispute resolution.
            </p>
            <a href="mailto:support@tezsend.com" className="text-secondary font-semibold text-lg hover:underline">
              support@tezsend.com
            </a>
          </div>

          {/* Phone Support */}
          <div className="bg-surface-container-low/50 border border-white/5 rounded-2xl p-8 hover:bg-surface-container transition-all">
            <div className="w-14 h-14 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary mb-6">
              <span className="material-symbols-outlined text-2xl">call</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Call Us</h3>
            <p className="text-on-surface-variant mb-6">
              Available Monday to Friday, 9:00 AM to 6:00 PM (IST).
            </p>
            <a href="tel:+917875914188" className="text-tertiary font-semibold text-lg hover:underline">
              +91-7875914188
            </a>
          </div>

          {/* Address */}
          <div className="bg-surface-container-low/50 border border-white/5 rounded-2xl p-8 hover:bg-surface-container transition-all md:col-span-2 mt-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined text-2xl">location_on</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Registered Business Address</h3>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              TezSend.<br />
              304, 3rd floor, behind HDFC bank,<br />
              Pimple Gurav, Pune 411061<br />
              Maharashtra, India
            </p>
          </div>
        </div>
      </main>

      {/* Mobile Navigation Shell */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-safe pt-2 bg-surface-container/90 backdrop-blur-xl z-50 rounded-t-xl shadow-lg border-t border-white/5 h-20">
          <Link className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" to="/">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-caps text-label-caps mt-1">Dashboard</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" to="/send-money">
              <span className="material-symbols-outlined">swap_horiz</span>
              <span className="font-label-caps text-label-caps mt-1">Transfer</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" to="/history">
              <span className="material-symbols-outlined">history</span>
              <span className="font-label-caps text-label-caps mt-1">History</span>
          </Link>
      </nav>
    </div>
  );
};

export default Contact;
