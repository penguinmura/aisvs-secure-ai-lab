const winston = require('winston');
const path = require('path');

// ログ出力先のディレクトリ
const logsDir = path.join(__dirname, '../../logs');

// 共通のログフォーマット（ファイル出力用はJSON）
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // エラーのスタックトレースを含める
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'hole-in-ec-backend' },
    transports: [
        // エラーログ専用ファイル
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error' 
        }),
        // アプリケーションのビジネスイベントや一般ログ（監査ログ）
        new winston.transports.File({ 
            filename: path.join(logsDir, 'app.log') 
        })
    ]
});

// アクセスログ専用のロガー（Morganからの出力を受け取る）
const accessLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, message }) => {
            // Morganの文字列をそのまま、あるいはJSONで包んで出力
            return JSON.stringify({ timestamp, type: 'access', message });
        })
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'access.log') 
        })
    ]
});

// 開発環境の場合はコンソールにも色付きで出力する
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                let logMessage = `${timestamp} [${level}]: ${message}`;
                if (stack) {
                    logMessage += `\n${stack}`;
                }
                // エラー以外のメタデータがあれば表示
                if (Object.keys(meta).length > 0 && meta.service !== 'hole-in-ec-backend') {
                    logMessage += `\n${JSON.stringify(meta, null, 2)}`;
                }
                return logMessage;
            })
        )
    }));
    
    // アクセスログもコンソールで見たい場合（不要ならコメントアウト可）
    accessLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, message }) => {
                return `${timestamp} [ACCESS]: ${message}`;
            })
        )
    }));
}

// 既存のコードを壊さないように、メインロガーにaccessLoggerをプロパティとして生やしてエクスポート
logger.accessLogger = accessLogger;
module.exports = logger;
