import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './Cart.css';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await api.get('/cart');
                setCartItems(response.data);
            } catch (err) {
                setError('カートの取得に失敗しました。ログインしているか確認してください。');
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><p style={{ color: 'var(--text-muted)' }}>読み込み中...</p></div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="cart-container">
            <Link to="/" className="back-link">
                ← 買い物を続ける
            </Link>

            <h2 className="cart-header">買い物かご</h2>

            {cartItems.length === 0 ? (
                <div className="cart-empty">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>カートに商品はありません</h3>
                    <p>お気に入りの商品を見つけましょう！</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                        商品一覧を見る
                    </Link>
                </div>
            ) : (
                <div>
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-info">
                                    <Link to={`/products/${item.product.id}`} className="cart-item-title">
                                        {item.product.name}
                                    </Link>
                                    <p className="cart-item-price">単価: ¥{item.product.price.toLocaleString()}</p>
                                </div>
                                <div className="cart-item-actions">
                                    <p className="cart-item-quantity">数量: {item.quantity}</p>
                                    <p className="cart-item-subtotal">小計: ¥{(item.product.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <div className="cart-total">
                            <span className="cart-total-label">合計金額:</span>
                            <span className="cart-total-amount">¥{totalAmount.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={() => navigate('/checkout')}
                            className="btn btn-primary btn-checkout"
                        >
                            購入手続きへ進む
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
