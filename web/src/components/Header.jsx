import { Bell, Search } from 'lucide-react';

export default function Header({ user }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h3 className="brand-small">TezSend</h3>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search transactions, beneficiaries..." />
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn">
          <Bell size={18} />
        </button>

        <div className="header-user">
          <div className="avatar small">{user?.name?.charAt(0) || 'U'}</div>
          <div className="header-user-info">
            <div className="header-user-name">{user?.name || 'User'}</div>
            <div className="header-user-email">{user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
