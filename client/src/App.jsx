import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Success from './components/Success';
import Inquiry from './components/Inquiry';
import AdminLayout from './components/Admin/AdminLayout';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Profile from './components/Profile';
import NotFound from './components/errors/NotFound';
import Forbidden from './components/errors/Forbidden';
import ErrorBoundary from './components/errors/ErrorBoundary';
import api from './api';
import './App.css'; // Import the new App-specific layout styles
const AppContent = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  React.useEffect(() => {
    if (token) {
      // ログイン状態であればユーザー情報を取得
      api.get('/users/me')
        .then(res => setUserData(res.data))
        .catch(() => {
          // トークン無効などの場合はクリア
          localStorage.removeItem('token');
          setToken('');
          setUserData(null);
        });
    } else {
      setUserData(null);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUserData(null);
    alert('ログアウトしました');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="app-container">
      {/* Header Area */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="brand-logo">
            hole-in-<span>EC</span>
          </Link>

          <nav className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/')}`}>商品一覧</Link>
            <Link to="/inquiry" className={`nav-link ${isActive('/inquiry')}`}>お問い合わせ</Link>
          </nav>

          <div className="nav-actions">
            {token ? (
              <>
                {userData?.role === 'ADMIN' && (
                  <Link to="/admin" className="btn btn-secondary" style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>⚙️ 管理画面</Link>
                )}
                <Link to="/cart" className="btn btn-primary">🛒 買い物かご</Link>
                <Link to="/profile" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : (userData?.email ? userData.email.charAt(0).toUpperCase() : '?')}
                  </div>
                  {userData?.name || (userData?.email ? userData.email.split('@')[0] : 'ユーザー')}
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary">ログアウト</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">ログイン</Link>
                <Link to="/register" className="btn btn-secondary">新規登録</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/inquiry" element={<Inquiry />} />
            <Route path="/admin/*" element={<AdminLayout userData={userData} />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile setUserData={setUserData} />} />
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer Area */}
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} hole-in-EC. All rights reserved.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          This is a satirical demonstration project. Do not enter real personal information.
        </p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
