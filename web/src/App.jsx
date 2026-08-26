import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddBeneficiary from './pages/AddBeneficiary';
import AddCard from './pages/AddCard';
import SendMoney from './pages/SendMoney';
import History from './pages/History';
import About from './pages/About';
import Contact from './pages/Contact';
import Transferred from './pages/Transferred';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Transfer confirmation — public, accessed by Android app deep-link / WebView */}
          <Route path="/transferred" element={<Transferred />} />
          <Route path="/transferred/:status" element={<Transferred />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-beneficiary" element={<AddBeneficiary />} />
            <Route path="/add-card" element={<AddCard />} />
            <Route path="/send-money" element={<SendMoney />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
