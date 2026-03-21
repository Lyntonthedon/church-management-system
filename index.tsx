
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

const Root = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('church_mgmt_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('church_mgmt_user');
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={(u) => setUser(u)} />} />
          <Route path="/*" element={user ? <App user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Root />);
