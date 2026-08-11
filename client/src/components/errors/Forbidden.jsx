import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

const Forbidden = () => {
    return (
        <div className="error-page-container">
            <div className="error-icon">🚫</div>
            <h1>403</h1>
            <h2>Forbidden</h2>
            <p>このページを閲覧する権限がありません。<br/>管理者専用の機能にアクセスしようとした可能性があります。</p>
            <div className="error-actions">
                <Link to="/" className="btn btn-primary">
                    🏠 トップページへ戻る
                </Link>
            </div>
        </div>
    );
};

export default Forbidden;
