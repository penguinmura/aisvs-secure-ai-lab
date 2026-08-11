/**
 * Admin Controller
 * 管理者向けダッシュボード等で必要な集計データを取得するコントローラー
 */
const adminService = require('../services/admin.service');

/**
 * 売上データと商品ごとの販売実績を取得する
 * @param {Object} req - Expressリクエストオブジェクト
 * @param {Object} res - Expressレスポンスオブジェクト
 * @param {Function} next - 次のミドルウェア（エラーハンドラー）へのコールバック
 */
const getSales = async (req, res, next) => {
    try {
        const salesData = await adminService.getSalesData();
        res.json(salesData);
    } catch (error) {
        next(error);
    }
};

/**
 * すべての注文履歴を取得する
 * @param {Object} req - Expressリクエストオブジェクト
 * @param {Object} res - Expressレスポンスオブジェクト
 * @param {Function} next - 次のミドルウェア
 */
const getOrders = async (req, res, next) => {
    try {
        const orders = await adminService.getOrders();
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

/**
 * すべてのお問い合わせ履歴を取得する
 * @param {Object} req - Expressリクエストオブジェクト
 * @param {Object} res - Expressレスポンスオブジェクト
 * @param {Function} next - 次のミドルウェア
 */
const getInquiries = async (req, res, next) => {
    try {
        const inquiries = await adminService.getInquiries();
        res.json(inquiries);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSales,
    getOrders,
    getInquiries
};
