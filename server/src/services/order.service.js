/**
 * Order Service
 * 注文（決済）処理に関する複雑なトランザクションロジックを担当する
 */
const prisma = require('../db');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * カートの内容をもとに注文処理（チェックアウト）を実行する
 * 在庫確認 -> 在庫減算 -> 注文データ作成 -> カート削除 を単一トランザクションで行う
 * 
 * @param {string} userId - 注文するユーザーのID
 * @param {string} paymentMethod - 支払い方法 (デフォルト: CREDIT_CARD)
 * @returns {Object} 作成された注文データ
 * @throws {Error} カートが空の場合、または在庫が不足している場合
 */
const createOrder = async (userId, paymentMethod = 'CREDIT_CARD', couponCode = null, paymentIntentId = null) => {
    const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true }
    });

    if (cartItems.length === 0) {
        throw new AppError('カートが空です', 400);
    }

    // トランザクション処理（途中で失敗した場合はすべての変更がロールバックされる）
    return prisma.$transaction(async (tx) => {
        // カート内の合計金額を計算
        let totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // クーポン処理
        if (couponCode) {
            const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
            if (!coupon) {
                logger.warn(`Order failed: Invalid coupon code ${couponCode} for user ${userId}`, { category: 'order', action: 'invalid_coupon', userId });
                throw new AppError('無効なクーポンコードです', 400);
            }
            if (coupon.isUsed) {
                logger.warn(`Order failed: Used coupon code ${couponCode} for user ${userId}`, { category: 'order', action: 'used_coupon', userId });
                throw new AppError('このクーポンは既に使用されています', 400);
            }
            
            // 割引適用（セキュアな実装：マイナスにならないように0を下限とする）
            totalAmount = Math.max(0, totalAmount - coupon.discountAmount);
            
            // クーポンを使用済みに更新
            await tx.coupon.update({
                where: { code: couponCode },
                data: { isUsed: true }
            });
        }

        // 1. 在庫チェックと減算
        for (const item of cartItems) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            
            // 在庫が足りない場合はエラーを投げ、トランザクションを中止する
            if (!product || product.stock < item.quantity) {
                logger.warn(`Order failed: Insufficient stock for product ${item.productId} for user ${userId}`, { category: 'order', action: 'insufficient_stock', userId, productId: item.productId });
                throw new AppError(`商品「${product?.name || item.productId}」の在庫が不足しています`, 400);
            }
            
            // 在庫を減らす
            await tx.product.update({
                where: { id: item.productId },
                data: { stock: product.stock - item.quantity }
            });
        }

        // 2. 注文(Order)と注文明細(OrderItem)データの作成
        const newOrder = await tx.order.create({
            data: {
                userId,
                totalAmount,
                paymentMethod,
                status: 'COMPLETED',
                orderItems: {
                    create: cartItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.product.price // 購入時点の価格を記録
                    }))
                }
            }
        });

        // 3. 決済完了後、ユーザーのカートを空にする
        await tx.cartItem.deleteMany({
            where: { userId }
        });

        logger.info(`Order created successfully: ${newOrder.id} by user ${userId} for amount ${totalAmount} (PaymentIntent: ${paymentIntentId})`, { category: 'order', action: 'order_success', userId, orderId: newOrder.id, amount: totalAmount, paymentIntentId });
        return newOrder;
    });
};

module.exports = {
    createOrder
};
