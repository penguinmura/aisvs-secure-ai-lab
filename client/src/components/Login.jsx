import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Auth.css';

const Login = ({ setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setToken(data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'ログイン失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">ログイン</h2>
                    <p className="auth-subtitle">アカウントへようこそ</p>
                </div>

                {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="auth-form-group">
                        <label className="auth-label">メールアドレス</label>
                        <input
                            type="email"
                            className="input-field auth-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="auth-form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="auth-label" style={{ marginBottom: 0 }}>パスワード</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none' }}>パスワードを忘れた場合</Link>
                        </div>
                        <input
                            type="password"
                            className="input-field auth-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-auth-submit" disabled={loading}>
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div className="auth-footer">
                    アカウントをお持ちでないですか？
                    <Link to="/register" className="auth-link">新規登録</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
