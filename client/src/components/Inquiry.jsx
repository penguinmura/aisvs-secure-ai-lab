import React, { useState } from 'react';
import api from '../api';
import './Inquiry.css';

const Inquiry = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            await api.post('/inquiries', { email, message });
            setStatus('success');
            setEmail('');
            setMessage('');
        } catch (error) {
            setStatus('error');
            console.error(error);
        }
    };

    return (
        <div className="inquiry-container">
            <div className="inquiry-card">
                <div className="inquiry-header">
                    <h2 className="inquiry-title">お問い合わせ</h2>
                    <p className="inquiry-subtitle">ご質問やご相談など、お気軽にお問い合わせください。</p>
                </div>

                {status === 'success' && (
                    <div className="status-alert status-success">
                        お問い合わせを受け付けました。ご記入いただいたメールアドレス宛に担当者より順次ご連絡いたします。
                    </div>
                )}

                {status === 'error' && (
                    <div className="status-alert status-error">
                        エラーが発生しました。入力内容をご確認の上、再度お試しください。
                    </div>
                )}

                <form onSubmit={handleSubmit} className="inquiry-form">
                    <div className="form-group">
                        <label className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="example@test.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">お問い合わせ内容</label>
                        <textarea
                            className="input-field inquiry-textarea"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            placeholder="お問い合わせ内容を詳細にご記入ください"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="btn btn-primary btn-submit-inquiry"
                    >
                        {status === 'sending' ? '送信中...' : '送信する'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Inquiry;
