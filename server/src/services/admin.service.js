/**
 * Admin Service
 * 管理者向け機能のデータ取得・集計ロジックを担当する
 */
const prisma = require('../db');
const logger = require('../utils/logger');

/**
 * すべての注文履歴を取得し、総売上額と商品ごとの販売実績を集計する
 * @returns {Object} { totalRevenue: number, productSales: Array }
 */
const getSalesData = async () => {
    logger.info(`Sales data requested by admin`, { category: 'admin', action: 'get_sales_data' });
    const orders = await prisma.order.findMany({
        include: {
            orderItems: {
                include: { product: true }
            }
        }
    });

    let totalRevenue = 0;
    const productSales = {};

    orders.forEach(order => {
        totalRevenue += order.totalAmount;
        order.orderItems.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.product?.name || '削除された商品',
                    quantitySold: 0,
                    revenue: 0
                };
            }
            productSales[item.productId].quantitySold += item.quantity;
            productSales[item.productId].revenue += (item.price * item.quantity);
        });
    });

    return {
        totalRevenue,
        productSales: Object.values(productSales).sort((a, b) => b.revenue - a.revenue)
    };
};

/**
 * すべてのユーザーの注文履歴を取得する（降順）
 */
const getOrders = async () => {
    logger.info(`All orders requested by admin`, { category: 'admin', action: 'get_all_orders' });
    return prisma.order.findMany({
        include: {
            user: { select: { email: true } },
            orderItems: {
                include: { product: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * すべてのお問い合わせ情報を取得する（降順）
 */
const getInquiries = async () => {
    logger.info(`All inquiries requested by admin`, { category: 'admin', action: 'get_all_inquiries' });
    return prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
    getSalesData,
    getOrders,
    getInquiries
};
