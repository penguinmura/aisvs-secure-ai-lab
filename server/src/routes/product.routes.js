/**
 * Product Routes
 * 商品関連のAPIエンドポイントを定義する
 * ベースURL: /api/products
 */
const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// パブリックルート（誰でもアクセス可能）
// ==========================================
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// ==========================================
// 認証必須ルート（ログインユーザーのみ）
// ==========================================
router.post('/:id/reviews', authenticate, productController.createReview);

// ==========================================
// 管理者必須ルート（Adminのみ操作可能）
// ==========================================
router.post('/', authenticate, authorizeAdmin, productController.createProduct);
router.put('/:id', authenticate, authorizeAdmin, productController.updateProduct);
router.delete('/:id', authenticate, authorizeAdmin, productController.deleteProduct);

module.exports = router;
