import React, { useEffect, useState } from 'react';
import api from '../../api';

const SalesDashboard = () => {
    const [salesData, setSalesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await api.get('/admin/sales');
                setSalesData(response.data);
                setLoading(false);
            } catch (err) {
                setError('売上データの取得に失敗しました');
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>売上ダッシュボード</h2>

            <div style={{ padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#495057' }}>総売上金額</h3>
                <p style={{ fontSize: '3em', fontWeight: 'bold', margin: '10px 0', color: '#28a745' }}>
                    ¥{salesData.totalRevenue.toLocaleString()}
                </p>
            </div>

            <h3>商品別売上ランキング</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>順位</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>商品名</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc', textAlign: 'right' }}>販売数</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc', textAlign: 'right' }}>売上金額</th>
                    </tr>
                </thead>
                <tbody>
                    {salesData.productSales.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{index + 1}</td>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.name}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{item.quantitySold} 個</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#007bff', fontWeight: 'bold' }}>
                                ¥{item.revenue.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {salesData.productSales.length === 0 && (
                        <tr>
                            <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>まだ売上データがありません。</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SalesDashboard;
