/**
 * Order Controller
 * 注文（決済）処理を担当するコントローラー
 */
const orderService = require('../services/order.service');

/**
 * カート内の商品をもとに注文を作成する（チェックアウト）
 * 在庫の減算とカートのクリアも同時に行われる
 */
const createOrder = async (req, res, next) => {
    try {
        const { paymentMethod, couponCode, paymentIntentId } = req.body;
        const order = await orderService.createOrder(req.user.userId, paymentMethod, couponCode, paymentIntentId);
        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder
};
