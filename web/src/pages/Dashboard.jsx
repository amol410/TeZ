import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalTransfer, setTotalTransfer] = useState(0);
  const [loading, setLoading] = useState(true);

  const balanceCardRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardsRes, benRes, txRes, summaryRes] = await Promise.all([
          apiClient.get('/cards'),
          apiClient.get('/beneficiaries'),
          apiClient.get('/transactions/history'),
          apiClient.get('/transactions/summary')
        ]);
        setCards(cardsRes.data);
        setBeneficiaries(benRes.data);
        setTransactions(txRes.data);
        setTotalTransfer(summaryRes.data.totalVolume || 0);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMouseMove = (e) => {
    if (!balanceCardRef.current) return;
    const rect = balanceCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    balanceCardRef.current.style.setProperty('--mouse-x', `${x}px`);
    balanceCardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

  const avatarUrl = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDQxtbCJxXc27ZgQdthtdHYXWpMn48dEVYRtvKejG1LslF0U1fLfcMxHOjUDqPRiMaOkGTa8boncFMhYBZUMPFJYaYyfMQoPMpg9ggvEW4-rNIt-2k3PvwnuoVd3fnZnRmF6LM2Kw5CytiIra9FWDyHWMAAYY8-7IboxHpRMEaBeN2tofL_IxouVIjNftDhrKbp1IbJNvKxk-PQzqFApRz2Q_9kaK04rw3NyC1XFlBEK-9MqV6yrTLs";

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-lg fixed top-0 w-full z-50 border-b border-white/10 shadow-sm">
        <div className="flex justify-between items-center px-md py-sm w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-base">
            <span className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">TezSend</span>
          </div>
          <div className="hidden md:flex items-center gap-lg">
            <nav className="flex gap-md">
              <Link to="/" className="text-secondary font-bold font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">Home</Link>
              <Link to="/send-money" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">Pay</Link>
              <Link to="/history" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">History</Link>
              <Link to="/about" className="text-on-surface-variant font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-200">About Us</Link>
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

      <main className="pt-32 px-md max-w-container-max mx-auto">
        {/* Welcome Header */}
        <section className="mb-lg">
          <p className="font-label-caps text-label-caps text-secondary mb-xs">INSTITUTIONAL DASHBOARD</p>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Welcome back, <span className="text-primary-fixed-dim">{getFirstName(user?.name)}.</span>
          </h1>
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
          {/* Left Column: Balance & Quick Actions */}
          <div className="lg:col-span-8 space-y-md">
            {/* Total Balance Card (Vault Style) */}
            <div 
              ref={balanceCardRef}
              onMouseMove={handleMouseMove}
              className="vault-card metallic-texture rounded-xl p-md flex flex-col justify-between min-h-[240px] relative" 
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-xs">TOTAL TRANSFER VOLUME</p>
                    <h2 className="font-data-display text-4xl text-on-surface">{formatCurrency(totalTransfer)}</h2>
                  </div>
                  <div className="bg-secondary/10 px-sm py-xs rounded-lg border border-secondary/20 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
                    <span className="font-label-caps text-label-caps text-secondary">+2.4%</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 flex items-end justify-between mt-8">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs text-secondary">currency_bitcoin</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs text-primary">euro</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs text-tertiary">attach_money</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                    +{cards.length}
                  </div>
                </div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">SECURED BY TEZSEND VAULT</p>
              </div>
            </div>

            {/* Quick Actions Bento */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
              <Link to="/send-money" className="vault-card rounded-xl p-md flex flex-col items-start gap-md hover:bg-secondary/5 transition-all duration-200 group active:scale-95">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <div className="text-left">
                  <p className="font-headline-md text-body-md font-bold text-on-surface">Send Money</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant">INSTANT TRANSFER</p>
                </div>
              </Link>
              <Link to="/add-beneficiary" className="vault-card rounded-xl p-md flex flex-col items-start gap-md hover:bg-tertiary/5 transition-all duration-200 group active:scale-95">
                <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div className="text-left">
                  <p className="font-headline-md text-body-md font-bold text-on-surface">Add Beneficiary</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant">MANAGE RECIPIENTS</p>
                </div>
              </Link>
              <Link to="/add-card" className="vault-card rounded-xl p-md flex flex-col items-start gap-md hover:bg-primary/5 transition-all duration-200 group active:scale-95 col-span-2 md:col-span-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div className="text-left">
                  <p className="font-headline-md text-body-md font-bold text-on-surface">Add Card</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant">MANAGE CARDS</p>
                </div>
              </Link>
            </div>

            {/* Recent Transactions */}
            <div className="vault-card rounded-xl p-md">
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Recent Transactions</h3>
                <Link to="/history" className="text-secondary font-label-caps text-label-caps hover:underline">VIEW ALL</Link>
              </div>
              <div className="space-y-sm">
                {transactions.length === 0 ? (
                  <p className="text-on-surface-variant text-sm py-4 text-center">No transactions yet. Start a transfer to see history.</p>
                ) : (
                  transactions.slice(0, 5).map((tx, idx) => {
                    const date = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const isCompleted = tx.status === 'completed' || tx.status === 'COMPLETED';
                    
                    return (
                      <div key={tx.id || idx} className="flex items-center justify-between p-sm hover:bg-white/5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-md">
                          <div className={`w-12 h-12 rounded-full ${isCompleted ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center`}>
                            <span className="material-symbols-outlined">
                              {isCompleted ? 'call_made' : 'pending_actions'}
                            </span>
                          </div>
                          <div>
                            <p className="font-body-md font-bold text-on-surface">{tx.beneficiary?.bankName || tx.beneficiary?.accountNo || 'Unknown Beneficiary'}</p>
                            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Transfer • {date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-data-display text-body-md ${isCompleted ? 'text-on-surface' : 'text-on-surface'}`}>
                            {formatCurrency(tx.totalAmount || tx.amount)}
                          </p>
                          <p className={`font-label-caps text-[10px] ${isCompleted ? 'text-secondary/60' : 'text-error'}`}>
                            {tx.status?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Market & Insight */}
          <div className="lg:col-span-4 space-y-md">
            <div className="vault-card rounded-xl p-md bg-surface-container-low/50">
              <h3 className="font-label-caps text-label-caps text-primary mb-md">RENT PAYMENT</h3>
              <div className="space-y-md">
                <div className="flex flex-col gap-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">home</span>
                    </div>
                    <div>
                      <p className="font-body-md font-bold text-on-surface">Pay rent with Credit Card</p>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Earn rewards on every payment</p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">Unlock liquidity and manage your monthly expenses with institutional-grade precision.</p>
                  <Link to="/send-money" className="w-full py-sm bg-secondary text-on-secondary font-bold rounded-lg hover:opacity-80 transition-opacity active:scale-95 text-center block">
                    START TRANSFER
                  </Link>
                </div>
              </div>
            </div>

            <div className="vault-card rounded-xl p-md border-l-4 border-l-secondary">
              <div className="flex items-start gap-md">
                <span className="material-symbols-outlined text-secondary mt-1">shield_with_heart</span>
                <div>
                  <p className="font-headline-md text-body-md font-bold text-on-surface">Security Alert</p>
                  <p className="font-body-md text-sm text-on-surface-variant mt-xs">Your vault is 92% secure. Enable 2FA hardware key for maximum institutional protection.</p>
                  <button className="mt-md text-secondary font-label-caps text-label-caps hover:underline">UPGRADE SECURITY</button>
                </div>
              </div>
            </div>

            <div className="vault-card rounded-xl p-md bg-surface-container-low/50">
              <h3 className="font-label-caps text-label-caps text-primary mb-md">EDUCATION PAYMENT</h3>
              <div className="space-y-md">
                <div className="flex flex-col gap-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <div>
                      <p className="font-body-md font-bold text-on-surface">Pay education fee with Credit Card</p>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Earn rewards on every payment</p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">Unlock liquidity and manage your monthly expenses with institutional-grade precision.</p>
                  <Link to="/send-money" className="w-full py-sm bg-secondary text-on-secondary font-bold rounded-lg hover:opacity-80 transition-opacity active:scale-95 text-center block">
                    START TRANSFER
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Trust Footer */}
        <footer className="w-full max-w-container-max mx-auto mt-xl pt-lg border-t border-white/10 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">verified_user</span>
              <span className="font-label-caps text-on-surface-variant text-sm tracking-widest uppercase">Trust & Verification</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3">
              <a href="/legal/terms.html" className="text-on-surface-variant text-sm hover:text-secondary hover:underline transition-colors">Terms & Conditions</a>
              <a href="/legal/privacy.html" className="text-on-surface-variant text-sm hover:text-secondary hover:underline transition-colors">Privacy Policy</a>
              <a href="/legal/refund.html" className="text-on-surface-variant text-sm hover:text-secondary hover:underline transition-colors">Refund & Cancellation Policy</a>
            </div>
          </div>
        </footer>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden bg-surface-container/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] flex justify-around items-center h-20 px-4 pb-safe">
        <Link to="/" className="flex flex-col items-center justify-center text-secondary bg-secondary/10 rounded-xl px-4 py-1 active-nav-glow active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">grid_view</span>
          <span className="font-label-caps text-label-caps">Home</span>
        </Link>
        <Link to="/send-money" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-200 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">send</span>
          <span className="font-label-caps text-label-caps">Pay</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-200 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-label-caps text-label-caps">History</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-error transition-colors duration-200 active:scale-90 transition-all duration-200">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-caps text-label-caps">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
