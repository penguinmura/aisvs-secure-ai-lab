import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './ProductList.css';

const renderStars = (rating) => {
    const rounded = Math.round(rating);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
};

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const url = submittedQuery ? `/products?q=${encodeURIComponent(submittedQuery)}` : '/products';
                const response = await api.get(url);
                setProducts(response.data);
            } catch (err) {
                setError('商品の取得に失敗しました');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [submittedQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSubmittedQuery(searchQuery);
    };

    return (
        <div className="product-list-container">
            <h2 className="page-title">Featured Products</h2>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="商品を検索..."
                    style={{ padding: '0.75rem', width: '300px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}
                />
                <button type="submit" className="btn btn-primary">検索</button>
            </form>

            {submittedQuery && (
                <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    「{submittedQuery}」の検索結果: {products.length}件
                </p>
            )}

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>読み込み中...</p>
                </div>
            ) : (
                <>
                    {error && <div className="error-message">{error}</div>}

            <div className="product-grid">
                {products.map((product) => (
                    <Link to={`/products/${product.id}`} key={product.id} className="product-card">
                        <div className="product-image-wrapper">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
                            ) : (
                                <div className="product-no-image">No Image Available</div>
                            )}
                        </div>

                        <div className="product-info">
                            <h3 className="product-title">{product.name}</h3>
                            <p className="product-description">{product.description}</p>

                            <div className="product-footer">
                                <p className="product-price">¥{product.price.toLocaleString()}</p>
                                <div className="rating-container">
                                    <span className="product-rating">{renderStars(product.averageRating)}</span>
                                    <span className="rating-text">
                                        {product.averageRating.toFixed(1)} ({product.reviewsCount}件)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            </>
            )}
        </div>
    );
};

export default ProductList;
