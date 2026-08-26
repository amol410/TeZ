import { Navigate } from 'react-router-dom';

// Registration is handled via Google OAuth — no separate register page needed.
// Redirect anyone who lands on /register to /login.
export default function Register() {
  return <Navigate to="/login" replace />;
}
