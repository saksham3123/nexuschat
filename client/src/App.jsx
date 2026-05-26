import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import Sidebar from './components/Layout/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';

function ChatLayout() {
  const [activeRoom, setActiveRoom] = useState(null);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d0f14', fontFamily: "'Sora', sans-serif" }}>
      <Sidebar activeRoom={activeRoom} onSelectRoom={setActiveRoom} />
      <ChatWindow room={activeRoom} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ background: '#0d0f14', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f6ef7', fontFamily: 'monospace' }}>Connecting...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
