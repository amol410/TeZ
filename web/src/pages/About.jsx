import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const About = () => {
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
              <Link to="/about" className="text-secondary font-bold font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">About Us</Link>
              <Link to="/contact" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">Contact Us</Link>
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
      <main className="pt-32 px-md max-w-3xl mx-auto pb-32">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-secondary hover:underline font-semibold mb-6">
            <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
            Back to Dashboard
          </Link>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-4">Welcome to TezSend</h1>
          <p className="text-on-surface-variant text-lg">
            Empowering you to manage your cash flow and earn rewards on your largest monthly expenses.
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-container-low/50 border border-white/5 rounded-2xl p-8 hover:bg-surface-container transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">business</span>
              </div>
              <h2 className="text-2xl font-bold">Who We Are</h2>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              TezSend is operated by <strong>Tezsend</strong>, a registered company based in <strong>Pune, India</strong>. We are a financial technology platform designed to bring flexibility, convenience, and rewards to your largest monthly expenses.
            </p>
          </section>

          <section className="bg-surface-container-low/50 border border-white/5 rounded-2xl p-8 hover:bg-surface-container transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl">lightbulb</span>
              </div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              Rent and education fees are often the most significant expenses for individuals and families. Historically, these had to be paid via cash, checks, or direct bank transfers. Our mission is to empower you to manage your cash flow better by allowing you to pay these major expenses using your credit card—giving you more time to pay, whilst earning valuable reward points and cashback from your card issuer.
            </p>
          </section>

          <section className="bg-surface-container-low/50 border border-white/5 rounded-2xl p-8 hover:bg-surface-container transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <h2 className="text-2xl font-bold">Why Trust Us?</h2>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-lg">
              We understand that transferring large sums of money requires absolute trust. That is why we have partnered with industry-leading, PCI-DSS compliant payment gateways and robust banking partners. We employ strict KYC verification to ensure that every transaction is legitimate, secure, and delivered on time.
            </p>
          </section>
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

export default About;
