/**
 * Inquiry Service
 * お問い合わせの保存ロジックを担当する
 */
const prisma = require('../db');

/**
 * 新しいお問い合わせデータをデータベースに保存する
 * @param {string} email - 返信用メールアドレス
 * @param {string} message - お問い合わせ内容
 */
const createInquiry = async (email, message) => {
    return prisma.inquiry.create({
        data: { email, message }
    });
};

module.exports = {
    createInquiry
};
