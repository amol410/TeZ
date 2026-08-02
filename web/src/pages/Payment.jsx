import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, IndianRupee, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import api from '../api';

export default function Payment() {
  const [step, setStep] = useState(1);
  // Beneficiary
  const [beneficiaryType, setBeneficiaryType] = useState('BANK'); // 'BANK' or 'UPI'
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState(null);

  const [amount, setAmount] = useState('');
  const [feeDetails, setFeeDetails] = useState(null);
  const [cardAdded, setCardAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddCardMock = async () => {
    try {
      await api.post('/cards', { token: 'mock_token_123', last4: '4242', network: 'Visa' });
      setCardAdded(true);
      setTimeout(() => setStep(2), 600);
    } catch (err) {
      alert('Failed to add card');
    }
  };

  const handleAmountChange = async (e) => {
    const val = e.target.value;
    setAmount(val);
    if (!val || isNaN(val)) {
      setFeeDetails(null);
      return;
    }

    try {
      const response = await api.post('/transactions/calculate-fee', { amount: parseFloat(val) });
      setFeeDetails(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBeneficiary = async () => {
    // Create beneficiary then move to amount step
    try {
      const payload = beneficiaryType === 'UPI'
        ? { type: 'UPI', upiId }
        : { type: 'BANK', accountNo, ifsc, bankName };

      const res = await api.post('/beneficiaries', payload);
      setBeneficiaryId(res.data.id);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to save beneficiary');
    }
  };

  const handlePay = async () => {
    if (!beneficiaryId || !amount) return;
    setLoading(true);

    try {
      const txRes = await api.post('/transactions/initiate', {
        beneficiaryId,
        amount: parseFloat(amount)
      });

      // Mock Airpay flow
      setTimeout(() => {
        setLoading(false);
        alert(`Payment of ₹${txRes.data.totalAmount} Successful via Airpay!\nOrder ID: ${txRes.data.airpayOrderId}`);
        navigate('/');
      }, 1500);

    } catch (err) {
      setLoading(false);
      alert('Payment initiation failed');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="page-title text-center" style={{ textAlign: 'center' }}>Send Rent</h1>
      <p className="page-subtitle text-center" style={{ textAlign: 'center' }}>Complete your payment in 3 simple steps.</p>

      {/* Stepper */}
      <div className="stepper">
        <div className={`step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
          <div className="step-num">{step > 1 ? <Check size={16}/> : '1'}</div>
          <div className="step-label">Beneficiary</div>
        </div>
        <div className={`step-connector ${step > 1 ? 'done' : ''}`}></div>

        <div className={`step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
          <div className="step-num">{step > 2 ? <Check size={16}/> : '2'}</div>
          <div className="step-label">Amount</div>
        </div>
        <div className={`step-connector ${step > 2 ? 'done' : ''}`}></div>

        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-num">3</div>
          <div className="step-label">Pay</div>
        </div>
      </div>

      <div className="card">
        {step === 1 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Beneficiary Details</h3>

            <div className="form-group">
              <label className="form-label">Transfer Type</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="radio" name="type" checked={beneficiaryType === 'BANK'} onChange={() => setBeneficiaryType('BANK')} /> Bank Account
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="radio" name="type" checked={beneficiaryType === 'UPI'} onChange={() => setBeneficiaryType('UPI')} /> UPI ID
                </label>
              </div>
            </div>

            {beneficiaryType === 'BANK' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" className="form-input" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="e.g. 012345678901" />
                </div>
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input type="text" className="form-input" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank Name (optional)</label>
                  <input type="text" className="form-input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Beneficiary UPI ID</label>
                <input type="text" className="form-input" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. vendor@okhdfcbank" />
              </div>
            )}

            <div className="flex-row mt-2">
              <button className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateBeneficiary} disabled={beneficiaryType === 'BANK' ? !(accountNo && ifsc) : !upiId}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={20} color="var(--brand)"/> Transfer Amount
            </h3>
            <div className="form-group">
              <input 
                type="number" 
                className="form-input" 
                style={{ fontSize: '1.5rem', padding: '1rem', textAlign: 'center', fontWeight: 600 }}
                placeholder="₹ 0.00"
                value={amount}
                onChange={handleAmountChange}
                autoFocus
              />
            </div>

            {feeDetails && (
              <div className="card-elevated mt-1">
                <div className="fee-row">
                  <span>Transfer Amount</span>
                  <span>₹{feeDetails.amount.toLocaleString()}</span>
                </div>
                <div className="fee-row">
                  <span>Convenience Fee (2%)</span>
                  <span>₹{feeDetails.convenienceFee.toLocaleString()}</span>
                </div>
                <div className="fee-row total">
                  <span>Total Payable</span>
                  <span className="fee-amount">₹{feeDetails.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex-row mt-2">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={!amount || loading}
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Review & Pay</h3>

            <div className="card-elevated">
              <div style={{ marginBottom: '0.5rem' }}><strong>Beneficiary</strong></div>
              {beneficiaryType === 'UPI' ? (
                <div>{upiId}</div>
              ) : (
                <div>{bankName || 'Bank Account' } • {accountNo} • IFSC {ifsc}</div>
              )}
              <hr style={{ margin: '0.75rem 0' }} />
              <div className="fee-row">
                <span>Amount</span>
                <span>₹{feeDetails?.amount?.toLocaleString() || amount}</span>
              </div>
              <div className="fee-row">
                <span>Convenience Fee</span>
                <span>₹{feeDetails?.convenienceFee?.toLocaleString() || '0'}</span>
              </div>
              <div className="fee-row total">
                <span>Total</span>
                <span className="fee-amount">₹{feeDetails?.totalAmount?.toLocaleString() || amount}</span>
              </div>
            </div>

            <div className="flex-row mt-2">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading} onClick={handlePay}>
                {loading ? <span className="spinner"></span> : `Pay ₹${feeDetails?.totalAmount?.toLocaleString() || amount}`}
              </button>
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
              Payments are securely processed via Airpay. RBI compliance enforced.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
