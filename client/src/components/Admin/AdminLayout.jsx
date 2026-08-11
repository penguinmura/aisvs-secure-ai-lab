import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ProductManager from './ProductManager';
import SalesDashboard from './SalesDashboard';
import OrderManager from './OrderManager';
import InquiryManager from './InquiryManager';

const AdminLayout = ({ userData }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else if (userData && userData.role !== 'ADMIN') {
            navigate('/forbidden');
        }
    }, [navigate, userData]);

    // 権限確認中（API取得待ち）のチラつきを防ぐ
    const token = localStorage.getItem('token');
    if (token && !userData) {
        return <div style={{ padding: '50px', textAlign: 'center' }}>権限を確認中...</div>;
    }

    // 権限がない場合は何も描画しない
    if (!userData || userData.role !== 'ADMIN') {
        return null;
    }

    return (
        <div style={{ display: 'flex', minHeight: '80vh', borderTop: '2px solid #333' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', backgroundColor: '#f8f9fa', padding: '20px', borderRight: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0 }}>管理者メニュー</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <li>
                        <Link to="/admin" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                            📊 売上ダッシュボード
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/products" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                            📦 商品管理
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/orders" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                            📝 注文履歴
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/inquiries" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                            ✉️ 問い合わせ一覧
                        </Link>
                    </li>
                </ul>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<SalesDashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="orders" element={<OrderManager />} />
                    <Route path="inquiries" element={<InquiryManager />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminLayout;
