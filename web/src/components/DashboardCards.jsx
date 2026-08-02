import { ArrowUpRight, CreditCard, Users } from 'lucide-react';

export default function DashboardCards({ totalSent = 0, totalFees = 0, transactionsCount = 0, onPay }) {
  return (
    <div className="dashboard-top">
      <div className="balance-card card">
        <div className="balance-row">
          <div>
            <div className="balance-label">Available Balance</div>
            <div className="balance-value">₹{Number(totalSent || 0).toLocaleString()}</div>
          </div>
          <div>
            <button className="btn btn-outline" onClick={onPay}><ArrowUpRight size={16} /> Pay Rent</button>
          </div>
        </div>
        <div className="quick-actions">
          <button className="qa-item"><CreditCard size={16} /> Add Card</button>
          <button className="qa-item"><Users size={16} /> Manage Beneficiaries</button>
          <button className="qa-item">Statements</button>
        </div>
      </div>

      <div className="mini-cards">
        <div className="stat-card blue card-sm">
          <div className="stat-label">Total Rent Sent</div>
          <div className="stat-value blue">₹{Number(totalSent || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card purple card-sm">
          <div className="stat-label">Total Fees</div>
          <div className="stat-value purple">₹{Number(totalFees || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card green card-sm">
          <div className="stat-label">Transactions</div>
          <div className="stat-value green">{transactionsCount}</div>
        </div>
      </div>
    </div>
  );
}
