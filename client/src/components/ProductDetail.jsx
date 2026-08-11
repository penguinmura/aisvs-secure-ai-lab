import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import './ProductDetail.css';

const renderStars = (rating) => {
    const rounded = Math.round(rating);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
};

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError('商品詳細の取得に失敗しました');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProductDetail();
    }, [id]);

    const handleAddReview = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/products/${id}/reviews`, {
                rating: rating,
                comment: comment || 'コメントなし'
            });
            alert('レビューを投稿しました');
            // 再取得してレビュー一覧を更新
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);
            setComment('');
            setRating(5);
        } catch (err) {
            alert(err.response?.data?.error || 'レビューの投稿に失敗しました');
        }
    };

    const handleAddToCart = async () => {
        try {
            await api.post('/cart', {
                productId: product.id,
                quantity: quantity
            });
            alert('カートに追加しました！');
        } catch (err) {
            alert(err.response?.data?.error || 'カートへの追加に失敗しました。ログインしているか確認してください。');
        }
    };

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><p style={{ color: 'var(--text-muted)' }}>読み込み中...</p></div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!product) return <p>商品が見つかりません。</p>;

    const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length
        : 0;

    return (
        <div className="product-detail-container">
            <Link to="/" className="back-link">
                ← 商品一覧へ戻る
            </Link>

            <div className="product-detail-layout">
                {/* Left: Image */}
                <div className="product-image-box">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="product-detail-img" />
                    ) : (
                        <div className="no-image-placeholder">No Image Available</div>
                    )}
                </div>

                {/* Right: Product Info & Actions */}
                <div className="product-info-box">
                    <h2 className="detail-title">{product.name}</h2>

                    <div className="detail-rating">
                        <span className="stars">{renderStars(averageRating)}</span>
                        <span className="rating-number">{averageRating.toFixed(1)}</span>
                        <span className="rating-count">({product.reviews.length}件の評価)</span>
                    </div>

                    <p className="detail-price">¥{product.price.toLocaleString()}</p>
                    <p className="detail-description">{product.description}</p>

                    <div className="action-area">
                        <div className="stock-status">
                            在庫あり: {product.stock}個
                        </div>

                        <div className="add-to-cart-group">
                            <select
                                className="quantity-select"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            >
                                {[...Array(Math.min(10, product.stock)).keys()].map(n => (
                                    <option key={n + 1} value={n + 1}>{n + 1}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddToCart}
                                className="btn btn-primary btn-add-cart"
                                disabled={product.stock === 0}
                            >
                                🛒 カートに追加する
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                <h3 className="reviews-header">カスタマーレビュー</h3>

                <div className="reviews-grid">
                    {/* Review List */}
                    <div className="review-list">
                        {product.reviews.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>まだ口コミはありません。</p>
                        ) : (
                            product.reviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="review-card-header">
                                        <div className="stars">
                                            {renderStars(review.rating)} <span className="rating-number" style={{ marginLeft: '0.5rem' }}>{review.rating}</span>
                                        </div>
                                        <span className="review-date">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                    <p className="review-author">投稿者: {review.user.email.split('@')[0]}***</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Review Form */}
                    <div>
                        <form onSubmit={handleAddReview} className="review-form-card">
                            <h4>レビューを投稿する</h4>
                            <div className="star-rating-input">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{ color: star <= rating ? '#fbbf24' : 'var(--border-color)' }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <textarea
                                className="input-field review-textarea"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="商品の感想を教えてください"
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                レビューを投稿する
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
