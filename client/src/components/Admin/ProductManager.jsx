import React, { useEffect, useState } from 'react';
import api from '../../api';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 新規登録用state
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });

    // 編集用state
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            setError('商品の取得に失敗しました');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', newProduct);
            alert('商品を追加しました');
            setNewProduct({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });
            await fetchProducts(); // awaitを追加して確実に再取得を待つ
        } catch (err) {
            alert('商品の追加に失敗しました');
        }
    };

    const handleEditStart = (product) => {
        setEditingId(product.id);
        setEditData({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl || ''
        });
    };

    const handleEditSave = async (id) => {
        try {
            await api.put(`/products/${id}`, editData);
            alert('商品を更新しました');
            setEditingId(null);
            fetchProducts();
        } catch (err) {
            alert('商品の更新に失敗しました');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('本当にこの商品（および関連するカート・レビュー・注文履歴等）を削除しますか？')) {
            return;
        }
        try {
            await api.delete(`/products/${id}`);
            alert('商品を削除しました');
            fetchProducts();
        } catch (err) {
            alert('商品の削除に失敗しました');
        }
    };

    const handleImageUpload = async (e, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await api.post('/upload/image', formData);
            const uploadedUrl = response.data.imageUrl;
            
            if (isEdit) {
                setEditData({ ...editData, imageUrl: uploadedUrl });
            } else {
                setNewProduct({ ...newProduct, imageUrl: uploadedUrl });
            }
            alert('画像をアップロードしました');
        } catch (err) {
            alert(err.response?.data?.error || '画像のアップロードに失敗しました');
        }
    };

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>商品管理</h2>

            <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3>新規商品の追加</h3>
                <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="商品名" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={{ padding: '8px' }} />
                    <input type="text" placeholder="商品説明" required value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ padding: '8px' }} />
                    <input type="number" placeholder="価格" required min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} style={{ padding: '8px' }} />
                    <input type="number" placeholder="初期在庫数" required min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} style={{ padding: '8px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '0.9rem' }}>画像:</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} style={{ fontSize: '0.9rem' }} />
                        {newProduct.imageUrl && <span style={{ fontSize: '0.8rem', color: 'green' }}>✓</span>}
                    </div>
                    <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>追加</button>
                </form>
            </div>

            <h3>登録済み商品一覧</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>画像</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>商品名</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>説明</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>価格</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>在庫</th>
                        <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                            {editingId === product.id ? (
                                <>
                                    <td style={{ padding: '10px' }}>
                                        {editData.imageUrl && <img src={editData.imageUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginBottom: '5px' }} />}
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} style={{ width: '120px', fontSize: '0.8rem' }} />
                                    </td>
                                    <td style={{ padding: '10px' }}><input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} /></td>
                                    <td style={{ padding: '10px' }}><input type="text" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} /></td>
                                    <td style={{ padding: '10px' }}><input type="number" min="0" value={editData.price} onChange={e => setEditData({ ...editData, price: Number(e.target.value) })} /></td>
                                    <td style={{ padding: '10px' }}><input type="number" min="0" value={editData.stock} onChange={e => setEditData({ ...editData, stock: Number(e.target.value) })} /></td>
                                    <td style={{ padding: '10px' }}>
                                        <button onClick={() => handleEditSave(product.id)} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>保存</button>
                                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td style={{ padding: '10px' }}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} /> : 'NO IMAGE'}</td>
                                    <td style={{ padding: '10px' }}>{product.name}</td>
                                    <td style={{ padding: '10px' }}>{product.description}</td>
                                    <td style={{ padding: '10px' }}>¥{product.price}</td>
                                    <td style={{ padding: '10px' }}>{product.stock}</td>
                                    <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                                        <button onClick={() => handleEditStart(product)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#333' }}>編集</button>
                                        <button onClick={() => handleDelete(product.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}>削除</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductManager;
