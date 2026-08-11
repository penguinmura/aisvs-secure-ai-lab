/**
 * Cart Service
 * 買い物かごのデータベース操作ロジックを担当する
 */
const prisma = require('../db');

/**
 * 特定ユーザーの現在のカート内容と商品情報を取得する
 * @param {string} userId - ユーザーID
 */
const getCartItems = async (userId) => {
    return prisma.cartItem.findMany({
        where: { userId },
        include: { product: true }
    });
};

/**
 * カートに商品を追加、または既存商品の数量を増やす
 * @param {string} userId - ユーザーID
 * @param {string} productId - 商品ID
 * @param {number} quantity - 追加する数量
 */
const addToCart = async (userId, productId, quantity) => {
    // すでに同じ商品がカートに入っているか確認
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            userId_productId: { userId, productId }
        }
    });

    if (existingItem) {
        // すでにある場合は数量を加算して更新
        return prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity }
        });
    } else {
        // ない場合は新規追加
        return prisma.cartItem.create({
            data: { userId, productId, quantity }
        });
    }
};

module.exports = {
    getCartItems,
    addToCart
};
