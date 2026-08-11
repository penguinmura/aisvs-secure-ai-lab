import React, { useEffect, useState } from 'react';
import api from '../../api';

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/admin/orders');
                setOrders(response.data);
                setLoading(false);
            } catch (err) {
                setError('注文データの取得に失敗しました');
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>注文履歴一覧</h2>
            <p>全ユーザーの購入履歴を確認できます。</p>

            {orders.length === 0 ? (
                <p>まだ注文はありません。</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', marginRight: '15px' }}>注文日時: {new Date(order.createdAt).toLocaleString()}</span>
                                    <span style={{ color: '#555' }}>購入者: {order.user.email}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#e63946' }}>合計: ¥{order.totalAmount.toLocaleString()}</span>
                                    <span style={{ display: 'block', fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                        支払方法: {
                                            order.paymentMethod === 'CREDIT_CARD' ? 'クレジットカード' :
                                                order.paymentMethod === 'BANK_TRANSFER' ? '銀行振込' :
                                                    order.paymentMethod === 'CONVENIENCE_STORE' ? 'コンビニ決済' : order.paymentMethod
                                        }
                                    </span>
                                </div>
                            </div>

                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1em', color: '#333' }}>購入商品</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {order.orderItems.map(item => (
                                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.95em' }}>
                                        <span>{item.product.name} × {item.quantity}</span>
                                        <span style={{ color: '#666' }}>¥{(item.price * item.quantity).toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderManager;
