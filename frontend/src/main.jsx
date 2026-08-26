import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

// Same Google Client ID as TezSend — one Google app for both
const GOOGLE_CLIENT_ID = '294998189349-qkqo2pholvm8fdg6qnbl15n8q56edcua.apps.googleusercontent.com';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('LMS Error Boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#0f172a', color: '#f43f5e', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2>⚠️ Runtime Error</h2>
          <pre style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', overflowX: 'auto' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
