/**
 * Inquiry Routes
 * お問い合わせ関連のAPIエンドポイントを定義する
 * ベースURL: /api/inquiries
 */
const express = require('express');
const inquiryController = require('../controllers/inquiry.controller');

const router = express.Router();

// 誰でもアクセス可能なパブリックルート
router.post('/', inquiryController.createInquiry);

module.exports = router;
