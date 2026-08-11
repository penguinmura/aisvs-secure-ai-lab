/**
 * Cart Controller
 * ユーザーの買い物かご（カート）に関する操作を担当するコントローラー
 */
const cartService = require('../services/cart.service');
const { cartSchema } = require('../schemas/cart.schema');

/**
 * ログイン中ユーザーのカートの中身を取得する
 */
const getCart = async (req, res, next) => {
    try {
        // req.user は authenticate ミドルウェアによって設定される
        const cartItems = await cartService.getCartItems(req.user.userId);
        res.json(cartItems);
    } catch (error) {
        next(error);
    }
};

/**
 * カートに商品を追加する
 * 既に同じ商品がカートにある場合は数量を加算する
 */
const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = cartSchema.parse(req.body);
        const item = await cartService.addToCart(req.user.userId, productId, quantity);
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart
};
