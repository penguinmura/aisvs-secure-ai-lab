import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './Success.css'; // Leverage existing CSS classes if any

// ==========================================
// 1. 【リアルモード】本物のStripe Elementsを使用するフォーム
// ==========================================
const RealStripeForm = ({ clientSecret, onSuccess, onError, processing, setProcessing, totalAmount }) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: 'EC Test User',
                    },
                },
            });

            if (error) {
                onError(error.message);
                setProcessing(false);
            } else if (paymentIntent.status === 'succeeded') {
                onSuccess(paymentIntent.id);
            }
        } catch (err) {
            onError(err.message || '決済処理中にエラーが発生しました');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.formContainer}>
            <div style={styles.stripeWrapper}>
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#1f2937',
                            '::placeholder': { color: '#9ca3af' },
                        },
                    }
                }} />
            </div>
            <button
                type="submit"
                disabled={processing || !stripe}
                style={{
                    ...styles.submitBtn,
                    opacity: (processing || !stripe) ? 0.6 : 1,
                    cursor: (processing || !stripe) ? 'not-allowed' : 'pointer'
                }}
            >
                {processing ? '決済処理中...' : `決済を確定する (¥${totalAmount.toLocaleString()})`}
            </button>
            <div style={styles.stripeBadge}>
                <svg width="33" height="15" viewBox="0 0 33 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                    <path d="M32.01 7.64c0-2.42-1.32-3.66-3.48-3.66-2.28 0-3.6 1.4-3.6 3.69 0 2.65 1.41 3.65 3.73 3.65 1.15 0 2.11-.23 2.76-.56v-1.63c-.63.29-1.42.48-2.3.48-1.22 0-1.78-.45-1.84-1.2h4.63c.04-.26.1-.55.1-.77zm-4.74-.83c.04-.68.51-1.12 1.22-1.12.68 0 1.14.44 1.15 1.12h-2.37zm-7.66 4.31c.42.23.94.39 1.48.39.99 0 1.47-.48 1.47-1.47V4.2h-2.31v1.17h.03c.31-.48.91-.77 1.62-.77.98 0 2.21.73 2.21 3.23 0 2.29-1.13 3.49-2.36 3.49-.78 0-1.37-.32-1.72-.74h-.03v.71c0 1.34-.69 2.05-2.09 2.05-.62 0-1.33-.18-1.87-.49v-1.72zm2.35-3.32c0-1.07.51-1.57 1.19-1.57.69 0 1.17.51 1.17 1.57 0 1.05-.48 1.58-1.17 1.58-.68 0-1.19-.53-1.19-1.58zm-7.85-3.6h-2.31v6.92h2.31V4.2zm-.16-2.41c0-.68-.52-1.18-1.24-1.18-.73 0-1.26.5-1.26 1.18 0 .69.53 1.19 1.26 1.19.72 0 1.24-.5 1.24-1.19zm-3.66 2.41h-2.12v-.89c0-.98.54-1.35 1.48-1.35.33 0 .58.03.74.07v-1.7c-.29-.07-.73-.12-1.3-.12-1.84 0-2.88.94-2.88 2.89v1.1h-1.32v1.82h1.32v5.1h2.06v-5.1h1.93l.09-1.82zm-8.81-.22c.81 0 1.24.36 1.36.96h2.02c-.17-1.54-1.46-2.58-3.38-2.58-2.22 0-3.68 1.4-3.68 3.65 0 2.5 1.41 3.73 3.69 3.73 1.95 0 3.27-1.05 3.42-2.56h-2.04c-.15.58-.58.91-1.38.91-.98 0-1.54-.6-1.54-1.92 0-1.44.59-2.19 1.53-2.19z" fill="#aab7c4"/>
                </svg>
                Secured by Stripe (Test Mode)
            </div>
        </form>
    );
};

// ==========================================
// 2. 【モックモード】Stripe Elementsを模した高精細な擬似カード入力フォーム
// ==========================================
const MockStripeForm = ({ onSuccess, onError, processing, setProcessing, totalAmount }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardBrand, setCardBrand] = useState('unknown');

    // カード番号の入力フォーマット (4桁ごとに半角スペース) とブランド検出
    const handleCardNumberChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 16) val = val.substring(0, 16);

        // クレジットカードブランドの判定
        if (val.startsWith('4')) {
            setCardBrand('visa');
        } else if (val.startsWith('51') || val.startsWith('52') || val.startsWith('53') || val.startsWith('54') || val.startsWith('55')) {
            setCardBrand('mastercard');
        } else if (val.startsWith('35')) {
            setCardBrand('jcb');
        } else if (val.startsWith('34') || val.startsWith('37')) {
            setCardBrand('amex');
        } else {
            setCardBrand('unknown');
        }

        const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
    };

    // 有効期限の入力フォーマット (MM / YY)
    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 4) val = val.substring(0, 4);

        if (val.length >= 3) {
            setExpiry(`${val.substring(0, 2)} / ${val.substring(2, 4)}`);
        } else {
            setExpiry(val);
        }
    };

    // CVCの入力フォーマット (最大4桁)
    const handleCvcChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        const maxLen = cardBrand === 'amex' ? 4 : 3;
        if (val.length > maxLen) val = val.substring(0, maxLen);
        setCvc(val);
    };

    const handleMockSubmit = (e) => {
        e.preventDefault();
        
        const cleanCard = cardNumber.replace(/\s/g, '');
        const cleanExpiry = expiry.replace(/\s|\//g, '');

        // 簡易バリデーション
        if (cleanCard.length < 15) {
            return onError('有効なクレジットカード番号を入力してください。');
        }
        if (cleanExpiry.length < 4) {
            return onError('有効期限を入力してください。');
        }
        const month = parseInt(cleanExpiry.substring(0, 2), 10);
        if (month < 1 || month > 12) {
            return onError('有効期限の月が正しくありません。');
        }
        if (cvc.length < 3) {
            return onError('セキュリティコード(CVC)を入力してください。');
        }

        setProcessing(true);

        // Stripe決済を模したローディングアニメーション (2秒)
        setTimeout(() => {
            const mockTxId = 'ch_mock_' + Math.random().toString(36).substring(2, 11);
            onSuccess(mockTxId);
        }, 2000);
    };

    // ブランドに応じたロゴアイコンSVG
    const renderCardBrandIcon = () => {
        switch (cardBrand) {
            case 'visa':
                return <span style={{...styles.brandIcon, color: '#1A1F71'}}>Visa</span>;
            case 'mastercard':
                return <span style={{...styles.brandIcon, color: '#EB001B'}}>MC</span>;
            case 'jcb':
                return <span style={{...styles.brandIcon, color: '#002E74'}}>JCB</span>;
            case 'amex':
                return <span style={{...styles.brandIcon, color: '#007BC1'}}>AMEX</span>;
            default:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign: 'middle'}}>
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                );
        }
    };

    return (
        <form onSubmit={handleMockSubmit} style={styles.formContainer}>
            <div style={styles.mockFormHeading}>
                <span style={styles.mockBadge}>開発用シミュレータ動作中</span>
                <p style={styles.mockHelp}>Stripeテストカード (例: <code>4242 4242 4242 4242</code>) でテストできます。</p>
            </div>
            
            <div style={styles.mockCardContainer}>
                {/* カード番号 */}
                <div style={styles.mockInputGroup}>
                    <label style={styles.mockLabel}>カード番号</label>
                    <div style={styles.mockInputWithIcon}>
                        <input
                            type="text"
                            placeholder="1234 5678 1234 5678"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            style={styles.mockInput}
                            required
                            disabled={processing}
                        />
                        <div style={styles.brandIconWrapper}>
                            {renderCardBrandIcon()}
                        </div>
                    </div>
                </div>

                <div style={styles.mockFlexRow}>
                    {/* 有効期限 */}
                    <div style={{...styles.mockInputGroup, flex: 1, marginRight: '1rem'}}>
                        <label style={styles.mockLabel}>有効期限 (MM / YY)</label>
                        <input
                            type="text"
                            placeholder="MM / YY"
                            value={expiry}
                            onChange={handleExpiryChange}
                            style={styles.mockInput}
                            required
                            disabled={processing}
                        />
                    </div>

                    {/* CVC */}
                    <div style={{...styles.mockInputGroup, flex: 1}}>
                        <label style={styles.mockLabel}>セキュリティコード</label>
                        <input
                            type="password"
                            placeholder="CVC"
                            value={cvc}
                            onChange={handleCvcChange}
                            style={styles.mockInput}
                            required
                            disabled={processing}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={processing}
                style={{
                    ...styles.submitBtn,
                    opacity: processing ? 0.6 : 1,
                    cursor: processing ? 'not-allowed' : 'pointer'
                }}
            >
                {processing ? '決済処理中...' : `テスト決済を確定する (¥${totalAmount.toLocaleString()})`}
            </button>

            <div style={styles.stripeBadge}>
                <svg width="33" height="15" viewBox="0 0 33 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                    <path d="M32.01 7.64c0-2.42-1.32-3.66-3.48-3.66-2.28 0-3.6 1.4-3.6 3.69 0 2.65 1.41 3.65 3.73 3.65 1.15 0 2.11-.23 2.76-.56v-1.63c-.63.29-1.42.48-2.3.48-1.22 0-1.78-.45-1.84-1.2h4.63c.04-.26.1-.55.1-.77zm-4.74-.83c.04-.68.51-1.12 1.22-1.12.68 0 1.14.44 1.15 1.12h-2.37zm-7.66 4.31c.42.23.94.39 1.48.39.99 0 1.47-.48 1.47-1.47V4.2h-2.31v1.17h.03c.31-.48.91-.77 1.62-.77.98 0 2.21.73 2.21 3.23 0 2.29-1.13 3.49-2.36 3.49-.78 0-1.37-.32-1.72-.74h-.03v.71c0 1.34-.69 2.05-2.09 2.05-.62 0-1.33-.18-1.87-.49v-1.72zm2.35-3.32c0-1.07.51-1.57 1.19-1.57.69 0 1.17.51 1.17 1.57 0 1.05-.48 1.58-1.17 1.58-.68 0-1.19-.53-1.19-1.58zm-7.85-3.6h-2.31v6.92h2.31V4.2zm-.16-2.41c0-.68-.52-1.18-1.24-1.18-.73 0-1.26.5-1.26 1.18 0 .69.53 1.19 1.26 1.19.72 0 1.24-.5 1.24-1.19zm-3.66 2.41h-2.12v-.89c0-.98.54-1.35 1.48-1.35.33 0 .58.03.74.07v-1.7c-.29-.07-.73-.12-1.3-.12-1.84 0-2.88.94-2.88 2.89v1.1h-1.32v1.82h1.32v5.1h2.06v-5.1h1.93l.09-1.82zm-8.81-.22c.81 0 1.24.36 1.36.96h2.02c-.17-1.54-1.46-2.58-3.38-2.58-2.22 0-3.68 1.4-3.68 3.65 0 2.5 1.41 3.73 3.69 3.73 1.95 0 3.27-1.05 3.42-2.56h-2.04c-.15.58-.58.91-1.38.91-.98 0-1.54-.6-1.54-1.92 0-1.44.59-2.19 1.53-2.19z" fill="#aab7c4"/>
                </svg>
                Secured by Stripe (Mock Simulator)
            </div>
        </form>
    );
};

// ==========================================
// 3. 【メインコンポーネント】StripeCardForm
// ==========================================
const StripeCardForm = ({ clientSecret, mockMode, onSuccess, onError, totalAmount }) => {
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSuccess = (transactionId) => {
        setErrorMsg('');
        onSuccess(transactionId);
    };

    const handleError = (message) => {
        setErrorMsg(message);
        onError(message);
    };

    return (
        <div style={styles.cardFormContainer}>
            {errorMsg && (
                <div style={styles.errorBanner}>
                    ⚠️ {errorMsg}
                </div>
            )}

            {mockMode ? (
                <MockStripeForm
                    onSuccess={handleSuccess}
                    onError={handleError}
                    processing={processing}
                    setProcessing={setProcessing}
                    totalAmount={totalAmount}
                />
            ) : (
                <RealStripeForm
                    clientSecret={clientSecret}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    processing={processing}
                    setProcessing={setProcessing}
                    totalAmount={totalAmount}
                />
            )}
        </div>
    );
};

// インラインスタイルの定義 (美しくプレミアムなマテリアルデザイン)
const styles = {
    cardFormContainer: {
        marginTop: '1.5rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    stripeWrapper: {
        padding: '0.875rem',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: '#f9fafb',
        marginBottom: '1.25rem',
        transition: 'border-color 0.2s',
        ':focus-within': {
            borderColor: '#2563eb',
            backgroundColor: '#ffffff',
        }
    },
    submitBtn: {
        padding: '0.875rem',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: '600',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
    },
    stripeBadge: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '0.875rem',
        fontSize: '0.75rem',
        color: '#6b7280',
    },
    errorBanner: {
        padding: '0.75rem 1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '6px',
        color: '#b91c1c',
        fontSize: '0.875rem',
        marginBottom: '1rem',
        fontWeight: '500',
    },
    mockFormHeading: {
        marginBottom: '1.25rem',
        borderBottom: '1px dashed #e5e7eb',
        paddingBottom: '0.75rem',
    },
    mockBadge: {
        display: 'inline-block',
        padding: '0.25rem 0.625rem',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        fontSize: '0.75rem',
        fontWeight: '600',
        borderRadius: '9999px',
        border: '1px solid #bfdbfe',
        marginBottom: '0.375rem',
    },
    mockHelp: {
        margin: 0,
        fontSize: '0.8rem',
        color: '#6b7280',
    },
    mockCardContainer: {
        padding: '1.25rem',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: '#f9fafb',
        marginBottom: '1.25rem',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
    },
    mockInputGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '1rem',
    },
    mockLabel: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: '0.375rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    mockInput: {
        padding: '0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '1rem',
        color: '#1f2937',
        backgroundColor: '#ffffff',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.15s',
    },
    mockInputWithIcon: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    brandIconWrapper: {
        position: 'absolute',
        right: '0.75rem',
        display: 'flex',
        alignItems: 'center',
    },
    brandIcon: {
        fontSize: '0.875rem',
        fontWeight: 'bold',
        letterSpacing: '-0.02em',
    },
    mockFlexRow: {
        display: 'flex',
    }
};

export default StripeCardForm;
