import React, { Component } from 'react';
import './ErrorPages.css';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // 次のレンダリングでフォールバックUIを表示する
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // エラーレポートサービスなどにエラーを記録することも可能
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-page-container">
                    <div className="error-icon">⚠️</div>
                    <h1>500</h1>
                    <h2>System Error</h2>
                    <p>
                        予期せぬシステムエラーが発生し、画面の描画を停止しました。<br/>
                        ご不便をおかけして申し訳ありません。時間をおいてから再度お試しください。
                    </p>
                    <div className="error-actions">
                        <button 
                            className="btn btn-primary" 
                            onClick={() => window.location.href = '/'}
                        >
                            🔄 アプリを再読み込みする
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
