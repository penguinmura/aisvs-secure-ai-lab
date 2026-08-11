import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

const NotFound = () => {
    return (
        <div className="error-page-container">
            <div className="error-icon">🔍</div>
            <h1>404</h1>
            <h2>Not Found</h2>
            <p>お探しのページは見つかりませんでした。<br/>URLが間違っているか、ページが移動または削除された可能性があります。</p>
            <div className="error-actions">
                <Link to="/" className="btn btn-primary">
                    🏠 トップページへ戻る
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
