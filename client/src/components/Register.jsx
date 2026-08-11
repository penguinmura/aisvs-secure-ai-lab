import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Auth.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('あなたの出身地は？');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', { email, password, name, address, securityQuestion, securityAnswer });
            alert('アカウントを登録しました。ログインしてください。');
            navigate('/login');
            } catch (err) {
            setError(err.response?.data?.error || '登録失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '600px', marginTop: '2rem', marginBottom: '2rem' }}>
                <div className="auth-header">
                    <h2 className="auth-title">新規登録</h2>
                    <p className="auth-subtitle">新しくアカウントを作成します</p>
                </div>

                {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleRegister}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="auth-label">メールアドレス *</label>
                            <input
                                type="email"
                                className="input-field auth-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="auth-label">パスワード *</label>
                            <input
                                type="password"
                                className="input-field auth-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={8}
                                placeholder="8文字以上"
                            />
                        </div>

                        <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="auth-label">ユーザー名（任意）</label>
                            <input
                                type="text"
                                className="input-field auth-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="表示名を変更できます（後から変更可能）"
                            />
                        </div>

                        <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="auth-label">住所（任意）</label>
                            <input
                                type="text"
                                className="input-field auth-input"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="配送先住所（後から変更可能）"
                            />
                        </div>

                        <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="auth-label">秘密の質問 *</label>
                            <select 
                                className="input-field auth-input" 
                                value={securityQuestion} 
                                onChange={e => setSecurityQuestion(e.target.value)}
                                required
                            >
                                <option value="あなたの出身地は？">あなたの出身地は？</option>
                                <option value="最初の子どもの名前は？">最初の子どもの名前は？</option>
                                <option value="初めて買った車の車種は？">初めて買った車の車種は？</option>
                                <option value="好きな食べ物は？">好きな食べ物は？</option>
                            </select>
                        </div>

                        <div className="auth-form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="auth-label">秘密の答え *</label>
                            <input
                                type="text"
                                className="input-field auth-input"
                                value={securityAnswer}
                                onChange={e => setSecurityAnswer(e.target.value)}
                                required
                                placeholder="パスワードリセット時に使用します"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-auth-submit" disabled={loading} style={{ marginTop: '2rem' }}>
                        {loading ? '登録中...' : 'アカウントを登録'}
                    </button>
                </form>

                <div className="auth-footer">
                    すでにアカウントをお持ちですか？
                    <Link to="/login" className="auth-link">ログイン</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
