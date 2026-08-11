/**
 * Cart Routes
 * 買い物かご関連のAPIエンドポイントを定義する
 * ベースURL: /api/cart
 */
const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// すべてのルートに「ログイン必須」のミドルウェアを適用
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);

module.exports = router;
