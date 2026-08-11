/**
 * Inquiry Controller
 * ユーザーからのお問い合わせ投稿を処理するコントローラー
 */
const inquiryService = require('../services/inquiry.service');
const { inquirySchema } = require('../schemas/inquiry.schema');

/**
 * 新しいお問い合わせを作成する
 */
const createInquiry = async (req, res, next) => {
    try {
        const { email, message } = inquirySchema.parse(req.body);
        const inquiry = await inquiryService.createInquiry(email, message);
        res.status(201).json({ message: 'お問い合わせを受け付けました', id: inquiry.id });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createInquiry
};
