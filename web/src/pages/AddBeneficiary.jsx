import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const AddBeneficiary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Since the provided UI asks for Account Number and IFSC, 
  // we will default the type to 'BANK' as per the API model.
  const [formData, setFormData] = useState({
    type: 'BANK', 
    upiId: '',
    bankName: '', // Maps to "Account Holder Name" in UI
    accountNo: '',
    confirmAccountNo: '',
    ifsc: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.accountNo !== formData.confirmAccountNo) {
      setError('Account numbers do not match.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiClient.post('/beneficiaries', formData);
      setSuccess(true);
      
      // Show subtle visual flash feedback
      const flash = document.createElement('div');
      flash.className = 'fixed inset-0 bg-secondary/10 pointer-events-none z-[100] animate-pulse';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 500);

      // Redirect after a short delay so the success animation can play
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add beneficiary');
      setIsSubmitting(false);
    }
  };

  const avatarUrl = user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCVSfPT2-oYZXCCHBfaBygl1SBDvFCJVqm-JvcJei_eS8CxKjq3--zqKQcsu1q1tqbdUFtKWPdCeyqh4SpF3yNsylwdIA2VbDX90bBt1qAL-9Up8Oesgzgz4a5lOu7FTDWc9fr15xVqcVgjLE9UTe9jdili4BE4oGsrML8kzPYnsbPaQ29wiTdcyDq6nl4efIFDsT9_r0CVl0XewbXw04dkisFs0k6wl7Thz_0EOjfrqwzrtIBZUhHD";

  return (
    <div className="font-body-md text-body-md min-h-screen flex flex-col items-center bg-background">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-lg border-b border-white/10 flex justify-between items-center px-md py-sm shadow-sm h-16">
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 active:scale-95 transition-all group" 
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined text-primary group-hover:text-secondary">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">Add Beneficiary</h1>
        </div>
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:opacity-80 transition-opacity">notifications</span>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-secondary/30">
            <img className="w-full h-full object-cover" alt="User Avatar" src={avatarUrl} />
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-lg mt-24 mb-32 px-gutter flex flex-col gap-lg">
        {/* Instructional Header */}
        <div className="flex flex-col gap-xs">
          <p className="font-label-caps text-label-caps text-secondary tracking-widest">SECURE TRANSFER</p>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Recipient Details</h2>
          <p className="text-on-surface-variant">Add a new bank account or UPI ID to your authorized beneficiary list for instant, secure payments.</p>
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error/50 text-error px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Form Card (The Vault) */}
        <section className="glass-vault rounded-xl p-md flex flex-col gap-md relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64FFDA 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <form className="flex flex-col gap-lg relative z-10" onSubmit={handleSubmit}>
            
            {/* Account Holder Name (Maps to bankName state) */}
            <div className="floating-label-group">
              <input 
                className="input-precision w-full h-14 px-md rounded-lg text-on-surface font-body-md" 
                id="bank_name" 
                name="bankName"
                placeholder=" " 
                required 
                type="text"
                value={formData.bankName}
                onChange={handleChange}
              />
              <label className="font-label-caps text-label-caps" htmlFor="bank_name">ACCOUNT HOLDER NAME</label>
              <span className="material-symbols-outlined success-check absolute right-4 top-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            {/* Account Number Field */}
            <div className="floating-label-group">
              <input 
                className="input-precision w-full h-14 px-md rounded-lg text-on-surface font-data-display" 
                id="account_number" 
                name="accountNo"
                placeholder=" " 
                required 
                type="password"
                value={formData.accountNo}
                onChange={handleChange}
              />
              <label className="font-label-caps text-label-caps" htmlFor="account_number">ACCOUNT NUMBER</label>
              <span className="material-symbols-outlined success-check absolute right-4 top-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            {/* Confirm Account Number Field */}
            <div className="floating-label-group">
              <input 
                className={`input-precision w-full h-14 px-md rounded-lg text-on-surface font-data-display ${
                  formData.confirmAccountNo && formData.accountNo !== formData.confirmAccountNo 
                    ? '!border-error !shadow-[0_0_0_4px_rgba(255,180,171,0.05)]' 
                    : ''
                }`}
                id="confirm_account_number" 
                name="confirmAccountNo"
                placeholder=" " 
                required 
                type="password"
                value={formData.confirmAccountNo}
                onChange={handleChange}
              />
              <label className="font-label-caps text-label-caps" htmlFor="confirm_account_number">CONFIRM ACCOUNT NUMBER</label>
              
              {formData.confirmAccountNo && formData.accountNo === formData.confirmAccountNo ? (
                <span className="material-symbols-outlined absolute right-4 top-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : formData.confirmAccountNo && formData.accountNo !== formData.confirmAccountNo ? (
                <span className="absolute right-4 top-4 text-error text-[10px] font-label-caps uppercase mt-1">Numbers don't match</span>
              ) : (
                <span className="material-symbols-outlined success-check absolute right-4 top-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </div>

            {/* IFSC Code Field */}
            <div className="floating-label-group">
              <input 
                className="input-precision w-full h-14 px-md rounded-lg text-on-surface font-data-display uppercase" 
                id="ifsc_code" 
                name="ifsc"
                placeholder=" " 
                required 
                type="text"
                value={formData.ifsc}
                onChange={handleChange}
              />
              <label className="font-label-caps text-label-caps" htmlFor="ifsc_code">IFSC CODE</label>
              <span className="material-symbols-outlined success-check absolute right-4 top-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            {/* UPI ID Field */}
            <div className="floating-label-group">
              <input 
                className="input-precision w-full h-14 px-md rounded-lg text-on-surface font-body-md" 
                id="upi_id" 
                name="upiId"
                placeholder=" " 
                type="text"
                value={formData.upiId}
                onChange={handleChange}
              />
              <label className="font-label-caps text-label-caps" htmlFor="upi_id">UPI ID (OPTIONAL)</label>
              <span className="material-symbols-outlined success-check absolute right-4 top-4 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            {/* Action Button */}
            <button 
              className={`btn-bloom w-full h-16 rounded-xl font-headline-md text-headline-md font-bold flex items-center justify-center gap-sm shadow-[0_0_20px_rgba(78,222,163,0.2)] hover:scale-[1.02] transition-all duration-200 ${success ? 'bg-tertiary text-on-tertiary' : 'bg-secondary text-on-secondary'} ${isSubmitting ? 'opacity-80' : ''}`} 
              type="submit"
              disabled={isSubmitting || success}
            >
              {isSubmitting && !success ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span> 
                  Processing...
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span> 
                  Beneficiary Added
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">verified_user</span>
                  Securely Save Beneficiary
                </>
              )}
            </button>
          </form>
        </section>

        {/* Compliance & Security Disclaimer */}
        <div className="flex flex-col items-center gap-sm text-center">
          <div className="flex items-center gap-xs text-secondary-fixed-dim">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            <span className="font-label-caps text-label-caps">ENCRYPTED DATA PROTOCOL</span>
          </div>
          <p className="text-on-surface-variant text-sm px-md leading-relaxed">
            Your data is encrypted using AES-256 military-grade standards. We never store your full bank credentials in plain text. Adding a beneficiary requires 2-step verification.
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface-container/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] h-20 px-4 pb-safe flex justify-around items-center">
        <Link to="/" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-200 active:scale-90">
          <span className="material-symbols-outlined">grid_view</span>
          <span className="font-label-caps text-label-caps mt-1">Home</span>
        </Link>
        <Link to="/send-money" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-200 active:scale-90">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          <span className="font-label-caps text-label-caps mt-1">Pay</span>
        </Link>
        <Link to="#" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-200 active:scale-90">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-label-caps text-label-caps mt-1">History</span>
        </Link>
        <Link to="#" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-200 active:scale-90">
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-caps text-label-caps mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default AddBeneficiary;
