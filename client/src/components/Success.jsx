import React from 'react';
import { Link } from 'react-router-dom';
import './Success.css';

const Success = () => {
    return (
        <div className="success-container">
            <div className="success-icon-wrapper">
                <span className="success-icon">✓</span>
            </div>

            <h2 className="success-title">ご注文ありがとうございます！</h2>

            <p className="success-message">
                購入手続きが正常に完了しました。<br />
                引き続きお買い物をお楽しみください。
            </p>

            <div>
                <Link to="/" className="btn btn-primary btn-back-home">
                    商品一覧へ戻る
                </Link>
            </div>
        </div>
    );
};

export default Success;
