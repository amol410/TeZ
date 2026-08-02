import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddBeneficiary from './pages/AddBeneficiary';
import AddCard from './pages/AddCard';
import SendMoney from './pages/SendMoney';

// Using a fallback for client ID to ensure it runs even if .env is missing.
// In a real app, ensure VITE_GOOGLE_CLIENT_ID is set.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '294998189349-qkqo2pholvm8fdg6qnbl15n8q56edcua.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-beneficiary" element={<AddBeneficiary />} />
              <Route path="/add-card" element={<AddCard />} />
              <Route path="/send-money" element={<SendMoney />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
