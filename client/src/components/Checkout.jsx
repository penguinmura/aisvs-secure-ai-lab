import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import api from '../api';
import StripeCardForm from './StripeCardForm';
import './Checkout.css';

const Checkout = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
    const [couponCode, setCouponCode] = useState('');
    
    // Stripe関連のステート
    const [clientSecret, setClientSecret] = useState('');
    const [mockMode, setMockMode] = useState(true);
    const [stripePromise, setStripePromise] = useState(null);

    const navigate = useNavigate();

    // 1. カート情報の読み込みとStripe公開鍵の初期化
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await api.get('/cart');
                if (response.data.length === 0) {
                    navigate('/cart');
                }
                setCartItems(response.data);
            } catch (err) {
                setError('カートの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchCart();

        // .env から公開鍵が設定されている場合のみStripeを初期化
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (publishableKey) {
            setStripePromise(loadStripe(publishableKey));
        }
    }, [navigate]);

    // 2. クレジットカード決済が選択された場合、Stripe PaymentIntentをバックエンドから取得
    useEffect(() => {
        if (paymentMethod === 'CREDIT_CARD' && cartItems.length > 0 && !clientSecret) {
            const getPaymentIntent = async () => {
                try {
                    const res = await api.post('/payments/create-intent');
                    setClientSecret(res.data.clientSecret);
                    setMockMode(res.data.mockMode);
                } catch (err) {
                    console.error('PaymentIntent creation failed:', err);
                    setError('決済プロセスの初期化に失敗しました。');
                }
            };
            getPaymentIntent();
        }
    }, [paymentMethod, cartItems, clientSecret]);

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // クレジットカード決済成功時の注文確定処理
    const handlePaymentSuccess = async (transactionId) => {
        setProcessing(true);
        try {
            await api.post('/orders', {
                paymentMethod: 'CREDIT_CARD',
                couponCode: couponCode || undefined,
                paymentIntentId: transactionId
            });
            navigate('/success');
        } catch (err) {
            alert(err.response?.data?.error || '注文処理に失敗しました。決済ID: ' + transactionId);
            setProcessing(false);
        }
    };

    // クレジットカード以外の支払い方法（銀行振込・コンビニ決済）の注文確定処理
    const handleCheckout = async () => {
        setProcessing(true);
        try {
            await api.post('/orders', { paymentMethod, couponCode: couponCode || undefined });
            navigate('/success');
        } catch (err) {
            alert(err.response?.data?.error || '注文処理に失敗しました');
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><p style={{ color: 'var(--text-muted)' }}>読み込み中...</p></div>;
    if (error) return <div className="error-message" style={{padding: '2rem', color: '#b91c1c'}}>{error}</div>;

    return (
        <div className="checkout-container">
            <Link to="/cart" className="back-link">
                ← カートに戻る
            </Link>

            <h2 className="checkout-header">購入確認</h2>
            <p className="checkout-subtitle">以下の内容で注文を確定しますか？</p>

            <div className="checkout-section">
                <h3 className="checkout-section-title">注文内容</h3>
                <ul className="order-list">
                    {cartItems.map((item) => (
                        <li key={item.id} className="order-list-item">
                            <span className="order-item-name">{item.product.name} × {item.quantity}</span>
                            <span className="order-item-price">¥{(item.product.price * item.quantity).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
                <div className="coupon-section" style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>クーポンコード</label>
                    <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="お持ちの場合は入力してください"
                        style={{ padding: '0.5rem', width: '100%', maxWidth: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>※割引は注文確定時に適用されます</p>
                </div>
                <div className="order-total-row">
                    <span className="order-total-label">お支払い合計</span>
                    <span className="order-total-value">¥{totalAmount.toLocaleString()}</span>
                </div>
            </div>

            <div className="checkout-section">
                <h3 className="checkout-section-title">お支払い方法</h3>
                <div className="payment-methods">
                    <label className="payment-option-label">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="CREDIT_CARD"
                            checked={paymentMethod === 'CREDIT_CARD'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        クレジットカード
                    </label>
                    <label className="payment-option-label">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="BANK_TRANSFER"
                            checked={paymentMethod === 'BANK_TRANSFER'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        銀行振込
                    </label>
                    <label className="payment-option-label">
                        <input
                            type="radio"
                            name="paymentMethod"
                            value="CONVENIENCE_STORE"
                            checked={paymentMethod === 'CONVENIENCE_STORE'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        コンビニ決済
                    </label>
                </div>

                {/* クレジットカード決済専用フォーム */}
                {paymentMethod === 'CREDIT_CARD' && clientSecret && (
                    <div>
                        {!mockMode && stripePromise ? (
                            /* 【リアルモード】Stripe Elementsをロード */
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <StripeCardForm
                                    clientSecret={clientSecret}
                                    mockMode={false}
                                    onSuccess={handlePaymentSuccess}
                                    onError={(msg) => alert(msg)}
                                    totalAmount={totalAmount}
                                />
                            </Elements>
                        ) : (
                            /* 【モックモード】擬似クレジットカードフォームを表示 */
                            <StripeCardForm
                                clientSecret={clientSecret}
                                mockMode={true}
                                onSuccess={handlePaymentSuccess}
                                onError={(msg) => alert(msg)}
                                totalAmount={totalAmount}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* クレジットカード以外の支払い方法の時のみ、この汎用確定ボタンを表示する */}
            {paymentMethod !== 'CREDIT_CARD' && (
                <div className="checkout-action">
                    <button
                        onClick={handleCheckout}
                        disabled={processing}
                        className="btn btn-primary btn-place-order"
                    >
                        {processing ? '処理中...' : '注文を確定する'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Checkout;
