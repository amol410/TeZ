import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const SendMoney = () => {
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [formData, setFormData] = useState({
    beneficiaryId: '',
    amount: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load beneficiaries so the user can select one
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        const response = await apiClient.get('/beneficiaries');
        setBeneficiaries(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, beneficiaryId: response.data[0].id }));
        }
      } catch (err) {
        setError('Failed to load beneficiaries');
      } finally {
        setLoading(false);
      }
    };
    fetchBeneficiaries();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.beneficiaryId) {
      setError('Please select a beneficiary');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/transactions/initiate', {
        beneficiaryId: formData.beneficiaryId,
        amount: Number(formData.amount)
      });
      
      setSuccess(`Transaction Initiated! Order ID: ${response.data.airpayOrderId}`);
      
      // Simulate delay for UI effect then redirect
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate transaction');
      setIsSubmitting(false);
    }
  };

  const amountNum = Number(formData.amount) || 0;
  const feeAmount = (amountNum * 0.02).toFixed(2);
  const totalAmount = (amountNum + Number(feeAmount)).toFixed(2);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  const selectedBeneficiary = beneficiaries.find(b => b.id === formData.beneficiaryId);

  return (
    <div className="font-body-md text-body-md min-h-screen flex flex-col items-center bg-background pb-32">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-lg border-b border-white/10 flex justify-between items-center px-md py-sm shadow-sm h-16">
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 active:scale-95 transition-all group" 
            onClick={() => navigate(-1)}
            type="button"
          >
            <span className="material-symbols-outlined text-primary group-hover:text-secondary">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">TezSend</h1>
        </div>
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-80 transition-opacity">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-80 transition-opacity">account_balance_wallet</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-lg mt-24 px-gutter flex flex-col gap-md items-center">
        
        {error && (
          <div className="w-full bg-error-container/20 border border-error/50 text-error px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full bg-secondary-container/20 border border-secondary/50 text-secondary px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            {success}
          </div>
        )}

        {beneficiaries.length === 0 ? (
          <div className="glass-vault rounded-xl p-lg text-center flex flex-col items-center gap-md w-full">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
            <h2 className="text-on-surface font-headline-md text-xl">No Beneficiaries Found</h2>
            <p className="text-on-surface-variant text-sm">You need to add a beneficiary before you can send money.</p>
            <Link to="/add-beneficiary" className="btn-bloom bg-secondary text-on-secondary px-6 py-3 rounded-lg font-bold mt-2">
              Add Beneficiary
            </Link>
          </div>
        ) : (
          <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
            
            {/* Beneficiary Selection Card */}
            <div className={`relative z-20 transition-[margin] duration-300 ease-in-out ${isDropdownOpen ? 'mb-56' : ''}`}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="glass-vault rounded-xl p-4 flex flex-col relative group cursor-pointer border border-white/5 hover:border-secondary/30 transition-all"
              >
                <div className="flex justify-between items-center relative z-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-on-surface font-headline-md text-lg font-semibold">
                        {selectedBeneficiary?.bankName || selectedBeneficiary?.type || 'Select Beneficiary'}
                      </span>
                      <span className="text-on-surface-variant text-xs font-label-caps tracking-widest uppercase mt-1">
                        {selectedBeneficiary?.type === 'BANK' ? 'BANK AC' : 'UPI ID'} • {selectedBeneficiary?.accountNo ? `•••• ${String(selectedBeneficiary.accountNo).slice(-4)}` : selectedBeneficiary?.upiId}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="border border-secondary/30 text-secondary text-[10px] px-2 py-1 rounded-full font-label-caps font-bold">
                      VERIFIED
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant transition-transform" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-high border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                  <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary/30 scrollbar-track-transparent">
                    {beneficiaries.map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => {
                          setFormData({ ...formData, beneficiaryId: b.id });
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${formData.beneficiaryId === b.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-on-surface-variant'}`}
                      >
                        <div className="flex items-center gap-3">
                          {formData.beneficiaryId === b.id && <span className="material-symbols-outlined text-[18px]">check</span>}
                          <span className={formData.beneficiaryId === b.id ? 'ml-0' : 'ml-[30px]'}>
                            {b.bankName || b.type} - {b.accountNo ? `**** ${String(b.accountNo).slice(-4)}` : b.upiId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input Card */}
            <div className="glass-vault rounded-xl p-lg flex flex-col gap-6 relative overflow-hidden">
              <div className="flex flex-col items-center">
                <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase mb-4">Amount to Send</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-secondary font-headline-lg text-4xl">₹</span>
                  <input 
                    type="number" 
                    name="amount" 
                    value={formData.amount} 
                    onChange={handleChange}
                    className="bg-transparent border-none text-on-surface font-headline-lg text-5xl w-48 text-center focus:ring-0 placeholder-on-surface-variant/30 p-0"
                    placeholder="0"
                    min="1"
                    required
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/10 my-2"></div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Convenience Fee (2%)</span>
                  <span className="text-on-surface font-data-display">₹{formatCurrency(feeAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface font-headline-md text-lg">Total Deducted</span>
                  <span className="text-secondary font-data-display text-xl">₹{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Funds will be settled instantly via NPCI protocol</span>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-surface-container/90 backdrop-blur-xl border-t border-white/5 p-4 z-40">
              <div className="max-w-lg mx-auto">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.amount || Number(formData.amount) <= 0}
                  className={`btn-bloom w-full h-14 rounded-xl font-headline-md text-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    isSubmitting || !formData.amount 
                      ? 'bg-secondary/50 text-on-secondary/50 cursor-not-allowed' 
                      : 'bg-secondary text-on-secondary shadow-[0_0_20px_rgba(78,222,163,0.2)] hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Pay <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default SendMoney;
