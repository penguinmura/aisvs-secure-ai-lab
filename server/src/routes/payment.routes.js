/**
   * Payment Routes
   * Stripe決済関連のAPIエンドポイントを定義する
   * ベースURL: /api/payments
   */
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

// Stripeクライアントの初期化（鍵がない場合はnull）
const stripe = process.env.STRIPE_SECRET_KEY
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;

/**
 * 決済インテント (PaymentIntent) を作成する
 * カートの合計金額を算出し、Stripe（またはモック）のクライアントシークレットを発行する
 */
router.post('/create-intent', authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 1. カートの商品情報を取得
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: { product: true }
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'カートが空です' });
        }

        // 2. カート内の合計金額を計算
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        if (stripe) {
            // 【リアルモード】Stripe APIを呼び出し
            logger.info(`Stripe: Creating real PaymentIntent for user ${userId} with amount ${totalAmount}`, { category: 'payment', action: 'create_intent_real', userId, amount: totalAmount });
            
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmount,
                currency: 'jpy',
                metadata: { userId },
                payment_method_types: ['card']
            });

            return res.json({
                clientSecret: paymentIntent.client_secret,
                mockMode: false,
                amount: totalAmount
            });
        } else {
            // 【モックモード】オフライン用の擬似シークレットを返却
            logger.info(`Stripe: Creating mock PaymentIntent for user ${userId} with amount ${totalAmount}`, { category: 'payment', action: 'create_intent_mock', userId, amount: totalAmount });
            
            const mockIntentId = 'pi_mock_' + Math.random().toString(36).substring(2, 11);
            const mockSecret = `${mockIntentId}_secret_${Math.random().toString(36).substring(2, 11)}`;

            return res.json({
                clientSecret: mockSecret,
                mockMode: true,
                amount: totalAmount
            });
        }
    } catch (error) {
        logger.error(`Stripe: Error creating payment intent: ${error.message}`, { category: 'payment', action: 'create_intent_error', error });
        next(error);
    }
});

module.exports = router;
