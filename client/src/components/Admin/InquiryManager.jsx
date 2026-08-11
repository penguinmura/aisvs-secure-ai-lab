import React, { useEffect, useState } from 'react';
import api from '../../api';

const InquiryManager = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const response = await api.get('/admin/inquiries');
                setInquiries(response.data);
                setLoading(false);
            } catch (err) {
                setError('お問い合わせデータの取得に失敗しました');
                setLoading(false);
            }
        };
        fetchInquiries();
    }, []);

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>問い合わせ一覧</h2>
            <p>ユーザーからのお問い合わせメッセージを確認できます。</p>

            {inquiries.length === 0 ? (
                <p>現在お問い合わせはありません。</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    {inquiries.map(inquiry => (
                        <div key={inquiry.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fdfdfd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                                <div>
                                    <span style={{ fontSize: '0.9em', color: '#666', marginRight: '10px' }}>送信日時:</span>
                                    <span style={{ fontWeight: 'bold' }}>{new Date(inquiry.createdAt).toLocaleString()}</span>
                                </div>
                                <div style={{ fontSize: '0.9em' }}>
                                    <span style={{ color: '#666', marginRight: '5px' }}>送信元:</span>
                                    <a href={`mailto:${inquiry.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>{inquiry.email}</a>
                                </div>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#333' }}>
                                {inquiry.message}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InquiryManager;
