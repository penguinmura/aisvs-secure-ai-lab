const { ZodError } = require('zod');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
    // 1. バリデーションエラー (ZodError)
    if (err instanceof ZodError) {
        logger.warn(`Validation Error: ${err.message} - ${req.originalUrl}`, { category: 'security', action: 'validation_failed' });
        return res.status(400).json({ error: '入力値が正しくありません', details: err.errors });
    }

    // 2. ビジネスロジックエラー (AppError)
    if (err instanceof AppError) {
        logger.warn(`Business Logic Error: ${err.message} - ${req.originalUrl}`);
        return res.status(err.statusCode).json({ error: err.message });
    }

    // 3. データベースエラー (Prisma Client Error)
    if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientValidationError) {
        logger.warn(`Database Error: ${err.code || 'Validation'} - ${req.originalUrl}`);
        return res.status(400).json({ error: 'データベースの処理中にエラーが発生しました。入力内容を確認してください。' });
    }

    // 4. 予期せぬシステムエラー (500)
    // 内部情報（err.messageやスタックトレース）は絶対にクライアントに返さず、ログにのみ記録する
    logger.error(`System Error: ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { stack: err.stack });
    res.status(500).json({ error: 'サーバーエラーが発生しました。時間をおいて再度お試しください。' });
};

module.exports = errorHandler;
