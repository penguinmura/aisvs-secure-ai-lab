import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css';

const Profile = ({ setUserData }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('あなたの出身地は？');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/users/me');
                setName(response.data.name || '');
                setEmail(response.data.email || '');
                setAddress(response.data.address || '');
                if (response.data.securityQuestion) {
                    setSecurityQuestion(response.data.securityQuestion);
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login');
                } else {
                    setStatus('error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus('');

        try {
            const dataToUpdate = { name, email, address, securityQuestion };
            if (password) {
                dataToUpdate.password = password;
            }
            if (securityAnswer) {
                dataToUpdate.securityAnswer = securityAnswer;
            }

            const response = await api.put('/users/me', dataToUpdate);

            // App stateを更新（ヘッダー等の表示用）
            setUserData(response.data);

            setStatus('success');
            setPassword(''); // パスワードフィールドはクリア
            setSecurityAnswer(''); // 答えフィールドもクリア
        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setSaving(false);

            // サクセスメッセージを一定時間後に消す
            if (status === 'success') {
                setTimeout(() => setStatus(''), 3000);
            }
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><p style={{ color: 'var(--text-muted)' }}>読み込み中...</p></div>;
    }

    const firstChar = name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?');

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {firstChar}
                    </div>
                    <h2 className="profile-title">アカウント情報</h2>
                    <p className="profile-subtitle">個人情報の確認・変更ができます</p>
                </div>

                <div className="profile-body">
                    <form className="profile-form" onSubmit={handleSubmit}>
                        {status === 'success' && (
                            <div className="status-alert status-success">
                                プロフィールを更新しました。
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="status-alert status-error">
                                更新に失敗しました。入力内容を確認してください。
                            </div>
                        )}

                        <div className="profile-form-group full-width">
                            <label className="profile-label">ユーザー名</label>
                            <input
                                type="text"
                                className="input-field profile-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="表示名"
                            />
                        </div>

                        <div className="profile-form-group full-width">
                            <label className="profile-label">メールアドレス</label>
                            <input
                                type="email"
                                className="input-field profile-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="profile-form-group full-width">
                            <label className="profile-label">配送先住所</label>
                            <input
                                type="text"
                                className="input-field profile-input"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="商品の配送先となる住所"
                            />
                        </div>

                        <div className="profile-form-group full-width">
                            <label className="profile-label">新しいパスワード (変更する場合のみ)</label>
                            <input
                                type="password"
                                className="input-field profile-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                minLength={8}
                                placeholder="変更しない場合は空欄のままにしてください"
                            />
                        </div>

                        <div className="profile-form-group full-width">
                            <label className="profile-label">秘密の質問</label>
                            <select
                                className="input-field profile-input"
                                value={securityQuestion}
                                onChange={e => setSecurityQuestion(e.target.value)}
                            >
                                <option value="あなたの出身地は？">あなたの出身地は？</option>
                                <option value="初めて飼ったペットの名前は？">初めて飼ったペットの名前は？</option>
                                <option value="母親の旧姓は？">母親の旧姓は？</option>
                                <option value="子供の頃の夢は？">子供の頃の夢は？</option>
                            </select>
                        </div>

                        <div className="profile-form-group full-width">
                            <label className="profile-label">秘密の質問の答え (変更する場合のみ)</label>
                            <input
                                type="text"
                                className="input-field profile-input"
                                value={securityAnswer}
                                onChange={e => setSecurityAnswer(e.target.value)}
                                placeholder="変更しない場合は空欄のままにしてください"
                            />
                        </div>

                        <div className="profile-actions">
                            <button
                                type="submit"
                                className="btn btn-primary btn-profile-submit"
                                disabled={saving}
                            >
                                {saving ? '更新中...' : '変更を保存する'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
