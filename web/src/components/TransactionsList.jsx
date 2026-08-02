import { ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'SUCCESS') return <span className="badge badge-success"><CheckCircle2 size={12}/> Success</span>;
  if (status === 'FAILED') return <span className="badge badge-failed"><XCircle size={12}/> Failed</span>;
  return <span className="badge badge-pending"><Clock size={12}/> Pending</span>;
}

export default function TransactionsList({ transactions = [] }) {
  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Recent Transactions</h2>
        <button className="btn btn-ghost btn-sm">View All</button>
      </div>

      {transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, opacity: 0.15, marginBottom: '1rem' }}>⏳</div>
          <p>No transactions yet.</p>
        </div>
      ) : (
        <div className="gap-1">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-row">
              <div className="flex-row">
                <div className={`tx-icon ${tx.status === 'SUCCESS' ? 'green' : tx.status === 'FAILED' ? 'red' : 'blue'}`}>
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{tx.beneficiary?.upiId || 'Rent Payment'}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>₹{tx.totalAmount.toLocaleString()}</h4>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
