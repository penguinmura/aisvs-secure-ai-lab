const prisma = require('../db');
const orderService = require('./order.service');

jest.mock('../db', () => ({
    cartItem: {
        findMany: jest.fn(),
        deleteMany: jest.fn()
    },
    coupon: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    product: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    order: {
        create: jest.fn()
    },
    $transaction: jest.fn(async (cb) => {
        // トランザクションコールバックに自身(prismaモック)を渡すことで
        // tx.model.method の呼び出しが prisma.model.method のモックとして扱われます
        return await cb(require('../db'));
    })
}));

describe('Order Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('カートが空の場合はエラーがスローされること', async () => {
            // 【確認内容】
            // 対象ユーザーのカートアイテムが存在しない（配列が空）の場合に、
            // 「カートが空です」というエラーが投げられて処理が中断されるかを確認します。
            prisma.cartItem.findMany.mockResolvedValue([]);
            await expect(orderService.createOrder('user-1')).rejects.toThrow('カートが空です');
        });

        it('クーポンなしで正常に注文処理が完了すること', async () => {
            // 【確認内容】
            // カートに商品があり、在庫も十分な場合に、在庫減算、Orderデータの作成、カートのクリアといった
            // トランザクション内の処理が順番に正しく呼び出され、合計金額も正しく計算されるかを確認します。
            const mockCartItems = [
                { productId: 'p1', quantity: 2, product: { price: 1000, stock: 5 } }
            ];
            prisma.cartItem.findMany.mockResolvedValue(mockCartItems);
            prisma.product.findUnique.mockResolvedValue({ id: 'p1', price: 1000, stock: 5 });
            prisma.order.create.mockResolvedValue({ id: 'order-1', totalAmount: 2000 });

            const result = await orderService.createOrder('user-1', 'CREDIT_CARD', null);

            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: 'p1' },
                data: { stock: 3 } // 在庫が2個減っているか
            });
            expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: 'user-1',
                    totalAmount: 2000, // 単価1000 x 2
                    paymentMethod: 'CREDIT_CARD'
                })
            }));
            expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
            expect(result.id).toBe('order-1');
        });

        it('クーポンありで割引が適用され注文処理が完了すること', async () => {
            // 【確認内容】
            // 有効なクーポンコードが渡された際に、クーポン情報が取得され、
            // 合計金額から正しく値引きが適用（今回は3000円から500円引きで2500円）され、
            // クーポンが「使用済み」に更新されるかを確認します。
            const mockCartItems = [
                { productId: 'p1', quantity: 3, product: { price: 1000, stock: 5 } } // 合計 3000
            ];
            const mockCoupon = { code: 'SAVE500', discountAmount: 500, isUsed: false };

            prisma.cartItem.findMany.mockResolvedValue(mockCartItems);
            prisma.coupon.findUnique.mockResolvedValue(mockCoupon);
            prisma.product.findUnique.mockResolvedValue({ id: 'p1', price: 1000, stock: 5 });
            prisma.order.create.mockResolvedValue({ id: 'order-2', totalAmount: 2500 });

            const result = await orderService.createOrder('user-1', 'CREDIT_CARD', 'SAVE500');

            expect(prisma.coupon.update).toHaveBeenCalledWith({
                where: { code: 'SAVE500' },
                data: { isUsed: true }
            });
            expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    totalAmount: 2500 // 3000 - 500
                })
            }));
            expect(result.id).toBe('order-2');
        });

        it('在庫が不足している場合にエラーがスローされること', async () => {
            // 【確認内容】
            // カートの要求数に対して商品の在庫が足りない場合（今回は要求2、在庫1）、
            // 在庫不足エラーがスローされてトランザクションがロールバック（中断）されるかを確認します。
            const mockCartItems = [
                { productId: 'p1', quantity: 2, product: { price: 1000, stock: 5, name: '商品A' } }
            ];
            prisma.cartItem.findMany.mockResolvedValue(mockCartItems);
            // 在庫が1しかない状態をモック
            prisma.product.findUnique.mockResolvedValue({ id: 'p1', name: '商品A', price: 1000, stock: 1 });

            await expect(orderService.createOrder('user-1')).rejects.toThrow('商品「商品A」の在庫が不足しています');
        });

        it('商品が存在しない場合にエラーがスローされること', async () => {
            const mockCartItems = [{ productId: 'p_none', quantity: 1, product: { price: 1000 } }];
            prisma.cartItem.findMany.mockResolvedValue(mockCartItems);
            prisma.product.findUnique.mockResolvedValue(null); // DBに商品が存在しない
            await expect(orderService.createOrder('user-1')).rejects.toThrow('商品「p_none」の在庫が不足しています');
        });

        it('無効なクーポンを指定した場合はエラーになること', async () => {
            prisma.cartItem.findMany.mockResolvedValue([{ productId: 'p1', quantity: 1, product: { price: 1000 } }]);
            prisma.coupon.findUnique.mockResolvedValue(null);
            await expect(orderService.createOrder('u1', 'CREDIT_CARD', 'INVALID')).rejects.toThrow('無効なクーポンコードです');
        });

        it('使用済みのクーポンを指定した場合はエラーになること', async () => {
            prisma.cartItem.findMany.mockResolvedValue([{ productId: 'p1', quantity: 1, product: { price: 1000 } }]);
            prisma.coupon.findUnique.mockResolvedValue({ code: 'USED', isUsed: true });
            await expect(orderService.createOrder('u1', 'CREDIT_CARD', 'USED')).rejects.toThrow('このクーポンは既に使用されています');
        });
    });
});
