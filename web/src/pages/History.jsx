import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const History = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Completed'); // Completed, Ongoing, Cancelled

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/transactions/history');
        setTransactions(res.data || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const avatarUrl = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDQxtbCJxXc27ZgQdthtdHYXWpMn48dEVYRtvKejG1LslF0U1fLfcMxHOjUDqPRiMaOkGTa8boncFMhYBZUMPFJYaYyfMQoPMpg9ggvEW4-rNIt-2k3PvwnuoVd3fnZnRmF6LM2Kw5CytiIra9FWDyHWMAAYY8-7IboxHpRMEaBeN2tofL_IxouVIjNftDhrKbp1IbJNvKxk-PQzqFApRz2Q_9kaK04rw3NyC1XFlBEK-9MqV6yrTLs";

  const renderIcon = (beneficiaryType) => {
    if (!beneficiaryType) return 'account_balance';
    if (beneficiaryType.toLowerCase() === 'vpa') return 'person';
    return 'account_balance';
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'Completed') return t.status.toLowerCase() === 'success' || t.status.toLowerCase() === 'completed';
    if (activeTab === 'Ongoing') return t.status.toLowerCase() === 'pending';
    if (activeTab === 'Cancelled') return t.status.toLowerCase() === 'failed' || t.status.toLowerCase() === 'cancelled';
    return true;
  });

  return (
    <div className="bg-surface font-body-md text-on-surface custom-scrollbar overflow-x-hidden min-h-screen">
      <style>{`
        .glass-card {
            background: rgba(21, 31, 55, 0.6);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.2s ease-out;
        }
        .glass-card:hover {
            border-color: rgba(78, 222, 163, 0.3);
            background: rgba(21, 31, 55, 0.8);
            transform: translateY(-2px);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1f2942;
            border-radius: 10px;
        }
        .tab-active {
            position: relative;
        }
        .tab-active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: #4edea3;
            border-radius: 2px;
        }
      `}</style>
      {/* SideNavBar (Desktop Only) */}
      <aside className="h-full w-64 fixed left-0 top-0 z-[60] bg-surface-dim shadow-xl bg-surface-container-lowest border-r border-outline-variant/20 py-lg hidden md:flex flex-col">
          <div className="px-md mb-xl">
              <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
                  TezSend Vault
              </h2>
              <p className="font-label-caps text-label-caps text-on-surface-variant mt-2 opacity-70">Institutional Grade Security</p>
          </div>
          
          <nav className="flex-grow">
              <div className="flex flex-col gap-1 px-sm">
                  <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-white/5 active:translate-x-1 transition-all" to="/">
                      <span className="material-symbols-outlined">account_balance</span> Accounts
                  </Link>
                  <Link className="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary font-semibold bg-secondary-container/20 border-r-4 border-secondary active:translate-x-1 transition-all" to="/history">
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>history</span> History
                  </Link>
              </div>
          </nav>
          
          <div className="px-md mt-auto">
              <button onClick={handleLogout} className="w-full py-3 px-4 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-error/10 hover:text-error hover:border-error transition-all duration-200 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">logout</span> Log Out
              </button>
          </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:ml-64 min-h-screen flex flex-col relative z-10">
          
          {/* TopAppBar */}
          <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-surface/80 backdrop-blur-xl shadow-sm bg-surface-container-low/50 border-b border-white/5">
              <div className="flex justify-between items-center px-gutter py-sm w-full max-w-container-max mx-auto h-16">
                  <div className="flex items-center gap-4">
                      <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">TezSend</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <button className="material-symbols-outlined text-secondary hover:text-secondary-fixed transition-colors active:scale-95">notifications</button>
                      <button className="material-symbols-outlined text-secondary hover:text-secondary-fixed transition-colors active:scale-95">account_balance_wallet</button>
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-secondary/30">
                          <img className="w-full h-full object-cover" src={avatarUrl} alt="Avatar" />
                      </div>
                  </div>
              </div>
          </header>

          {/* Main Canvas */}
          <main className="flex-grow pt-24 pb-32 px-gutter">
              <div className="max-w-4xl mx-auto">
                  
                  {/* Page Header */}
                  <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div>
                          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Transaction History</h1>
                          <p className="text-on-surface-variant opacity-70 mt-2">Comprehensive record of all your institutional settlements.</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface text-label-caps">
                              <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface text-label-caps">
                              <span className="material-symbols-outlined text-[18px]">download</span> Export
                          </button>
                      </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-8 border-b border-outline-variant/20 mb-md">
                      <button 
                        onClick={() => setActiveTab('Completed')} 
                        className={`pb-3 transition-all ${activeTab === 'Completed' ? 'text-secondary font-semibold tab-active' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        Completed
                      </button>
                      <button 
                        onClick={() => setActiveTab('Ongoing')} 
                        className={`pb-3 transition-all ${activeTab === 'Ongoing' ? 'text-secondary font-semibold tab-active' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        Ongoing
                      </button>
                      <button 
                        onClick={() => setActiveTab('Cancelled')} 
                        className={`pb-3 transition-all ${activeTab === 'Cancelled' ? 'text-secondary font-semibold tab-active' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        Cancelled
                      </button>
                  </div>

                  {/* Transaction List */}
                  <div className="space-y-3">
                      {loading ? (
                        <div className="py-8 text-center text-on-surface-variant">Loading transactions...</div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="py-8 text-center text-on-surface-variant">No transactions found for this category.</div>
                      ) : filteredTransactions.map((t, idx) => {
                          const isSend = true;
                          const name = t.beneficiary?.bankName || t.beneficiary?.upiId || t.beneficiary?.accountNo || 'Unknown Beneficiary';
                          const displayId = t.airpayOrderId || `TXN-${t.id.substring(0, 8).toUpperCase()}`;
                          const icon = renderIcon(t.beneficiary?.type);

                          return (
                            <div key={idx} className="glass-card p-4 rounded-xl flex items-center justify-between group cursor-pointer relative overflow-hidden" 
                                 onClick={(e) => {
                                     const ripple = document.createElement('div');
                                     ripple.className = 'absolute inset-0 bg-secondary/10 pointer-events-none rounded-xl transition-transform duration-500 ease-out z-0 scale-0';
                                     e.currentTarget.appendChild(ripple);
                                     setTimeout(() => ripple.classList.add('scale-100'), 10);
                                     setTimeout(() => ripple.remove(), 600);
                                 }}>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-secondary border border-white/5 shrink-0">
                                        <span className="material-symbols-outlined">{icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-on-surface group-hover:text-secondary transition-colors truncate max-w-[200px] sm:max-w-[300px] md:max-w-md">{name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{displayId}</span>
                                            <span className="w-1 h-1 rounded-full bg-outline-variant/50"></span>
                                            <span className="text-on-surface-variant text-sm opacity-60">{formatDate(t.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right relative z-10 shrink-0">
                                    <div className={`font-data-display text-data-display ${isSend ? 'text-on-surface' : 'text-secondary'}`}>
                                        {isSend ? '-' : '+'}{formatCurrency(t.totalAmount)}
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.status.toLowerCase() === 'pending' ? 'bg-yellow-400' : t.status.toLowerCase() === 'failed' || t.status.toLowerCase() === 'cancelled' ? 'bg-error' : 'bg-secondary'}`}></span>
                                        <span className={`text-[11px] font-label-caps uppercase tracking-tighter ${t.status.toLowerCase() === 'pending' ? 'text-yellow-400' : t.status.toLowerCase() === 'failed' || t.status.toLowerCase() === 'cancelled' ? 'text-error' : 'text-secondary'}`}>{t.status}</span>
                                    </div>
                                </div>
                            </div>
                          );
                      })}
                  </div>

                  {/* Pagination */}
                  {!loading && filteredTransactions.length > 0 && (
                      <div className="mt-lg text-center">
                          <button className="px-8 py-3 rounded-full border border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary transition-all font-semibold active:scale-95 flex items-center gap-2 mx-auto">
                              Load More Transactions
                              <span className="material-symbols-outlined text-sm">expand_more</span>
                          </button>
                      </div>
                  )}
              </div>
          </main>

          {/* Mobile Navigation Shell */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-safe pt-2 bg-surface-container/90 backdrop-blur-xl z-50 rounded-t-xl shadow-lg border-t border-white/5">
              <Link className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" to="/">
                  <span className="material-symbols-outlined">dashboard</span>
                  <span className="font-label-caps text-label-caps mt-1">Dashboard</span>
              </Link>
              <Link className="flex flex-col items-center justify-center text-secondary bg-secondary/10 rounded-xl px-3 py-1 scale-105" to="/history">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>history</span>
                  <span className="font-label-caps text-label-caps mt-1">History</span>
              </Link>
          </nav>
      </div>
    </div>
  );
};

export default History;
