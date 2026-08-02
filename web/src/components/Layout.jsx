import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect, useState } from 'react';
import api from '../api';

export default function Layout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/auth/me').then(res => { if (mounted) setUser(res.data); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="app-layout fade-in">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header user={user} />
        <main className="main-content">
          <div className="bg-orbs" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
