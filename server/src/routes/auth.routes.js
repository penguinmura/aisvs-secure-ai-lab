/**
 * Auth Routes
 * 認証関連（登録・ログイン）のAPIエンドポイントを定義する
 * ベースURL: /api/auth
 */
const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// 誰でもアクセス可能なパブリックルート
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.getSecurityQuestion);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
