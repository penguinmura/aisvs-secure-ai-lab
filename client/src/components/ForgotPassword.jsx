import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Auth.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFetchQuestion = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            setQuestion(data.question);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'メールアドレスが見つかりません');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, answer, newPassword });
            setMessage('パスワードを再設定しました。ログイン画面に移動します...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || '再設定に失敗しました。答えが間違っている可能性があります。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">パスワード再設定</h2>
                    <p className="auth-subtitle">
                        {step === 1 ? '登録したメールアドレスを入力してください' : '秘密の質問に答えて新しいパスワードを設定してください'}
                    </p>
                </div>

                {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}
                {message && <div style={{ color: 'green', marginBottom: '1.5rem', textAlign: 'center' }}>{message}</div>}

                {step === 1 ? (
                    <form className="auth-form" onSubmit={handleFetchQuestion}>
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
                        <button type="submit" className="btn btn-primary btn-auth-submit" disabled={loading}>
                            {loading ? '確認中...' : '次へ'}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <div className="auth-form-group">
                            <label className="auth-label">秘密の質問</label>
                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px' }}>
                                Q. {question}
                            </p>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">秘密の答え</label>
                            <input
                                type="text"
                                className="input-field auth-input"
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">新しいパスワード</label>
                            <input
                                type="password"
                                className="input-field auth-input"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                placeholder="8文字以上"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-auth-submit" disabled={loading || !!message}>
                            {loading ? '設定中...' : 'パスワードを再設定'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">ログイン画面に戻る</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
