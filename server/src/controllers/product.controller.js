/**
 * Product Controller
 * 商品情報の取得・操作、およびレビュー投稿を担当するコントローラー
 */
const productService = require('../services/product.service');
const { productSchema, productUpdateSchema, reviewSchema } = require('../schemas/product.schema');

/**
 * すべての商品一覧を取得する（平均評価なども付与）
 * キーワード検索にも対応
 */
const getProducts = async (req, res, next) => {
    try {
        const keyword = req.query.q;
        const products = await productService.getProducts(keyword);
        res.json(products);
    } catch (error) {
        next(error);
    }
};

/**
 * IDを指定して特定の商品の詳細情報を取得する
 */
const getProductById = async (req, res, next) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.json(product);
    } catch (error) {
        next(error);
    }
};

/**
 * 特定の商品に対してレビュー（評価・コメント）を投稿する
 */
const createReview = async (req, res, next) => {
    try {
        const { rating, comment } = reviewSchema.parse(req.body);
        const review = await productService.createReview(req.params.id, req.user.userId, rating, comment);
        res.status(201).json(review);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 管理者（Admin）用アクション
// ==========================================

/**
 * 【管理者】新しい商品を追加する
 */
const createProduct = async (req, res, next) => {
    try {
        const data = productSchema.parse(req.body);
        const product = await productService.createProduct(data);
        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

/**
 * 【管理者】既存の商品の情報を更新する
 */
const updateProduct = async (req, res, next) => {
    try {
        const data = productUpdateSchema.parse(req.body);
        const product = await productService.updateProduct(req.params.id, data);
        res.json(product);
    } catch (error) {
        next(error);
    }
};

/**
 * 【管理者】指定した商品を削除する（関連するカートや注文履歴も削除）
 */
const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createReview,
    createProduct,
    updateProduct,
    deleteProduct
};
