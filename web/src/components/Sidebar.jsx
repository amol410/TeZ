import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Send, User as UserIcon, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { setAuthToken } from '../api';

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Send size={20} color="var(--brand)" /></div>
          <span>TezSend</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/payment" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Send size={18} /> Send Rent
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user" style={{ marginBottom: '10px' }}>
              <div className="avatar">
                {user.avatar ? <img src={user.avatar} alt="Avatar" /> : user.name?.charAt(0) || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button className="sidebar-link" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/payment" className={({ isActive }) => `bottom-nav-link ${isActive ? 'active' : ''}`}>
          <Send size={20} />
          <span>Pay Rent</span>
        </NavLink>
        <button className="bottom-nav-link" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}
