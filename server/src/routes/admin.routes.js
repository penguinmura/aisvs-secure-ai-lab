/**
 * Admin Routes
 * 管理者専用のAPIエンドポイントを定義する
 * ベースURL: /api/admin
 */
const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// すべてのルートに「ログイン必須」かつ「管理者権限必須」のミドルウェアを適用
router.use(authenticate, authorizeAdmin);

router.get('/sales', adminController.getSales);
router.get('/orders', adminController.getOrders);
router.get('/inquiries', adminController.getInquiries);

module.exports = router;
