/**
 * Order Routes
 * 注文・決済関連のAPIエンドポイントを定義する
 * ベースURL: /api/orders
 */
const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 注文処理はログイン必須
router.post('/', authenticate, orderController.createOrder);

module.exports = router;
