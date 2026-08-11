/**
 * User Routes
 * ユーザープロフィール関連のAPIエンドポイントを定義する
 * ベースURL: /api/users
 */
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// すべてのルートに「ログイン必須」のミドルウェアを適用
router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);

module.exports = router;
