const prisma = require('../db');
const adminService = require('./admin.service');

jest.mock('../db', () => ({
    order: {
        findMany: jest.fn()
    }
}));

describe('Admin Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSalesData', () => {
        it('売上データが正しく集計されること', async () => {
            // 【確認内容】
            // 複数の注文（Order）と注文明細（OrderItem）が含まれるデータをモックとして返し、
            // 合計売上（totalRevenue）と商品ごとの売上（productSales）が正しく合算されて出力されるかを確認します。
            const mockOrders = [
                {
                    totalAmount: 1500,
                    orderItems: [
                        { productId: 'p1', product: { name: '商品A' }, quantity: 1, price: 1500 }
                    ]
                },
                {
                    totalAmount: 2000,
                    orderItems: [
                        { productId: 'p1', product: { name: '商品A' }, quantity: 1, price: 1000 },
                        { productId: 'p2', product: { name: '商品B' }, quantity: 1, price: 1000 }
                    ]
                }
            ];

            prisma.order.findMany.mockResolvedValue(mockOrders);

            const result = await adminService.getSalesData();

            expect(result.totalRevenue).toBe(3500);
            expect(result.productSales.length).toBe(2);
            expect(result.productSales.find(p => p.name === '商品A').revenue).toBe(2500);
            expect(result.productSales.find(p => p.name === '商品A').quantitySold).toBe(2);
            expect(result.productSales.find(p => p.name === '商品B').revenue).toBe(1000);
            expect(result.productSales.find(p => p.name === '商品B').quantitySold).toBe(1);
        });

        it('削除済み商品が含まれていてもエラーにならず集計されること', async () => {
            // 【確認内容】
            // 商品データが削除されていて item.product が null の場合でも、
            // オプショナルチェイニングのフォールバックにより「削除された商品」として集計され、クラッシュしないかを確認します。
            const mockOrders = [
                {
                    totalAmount: 1000,
                    orderItems: [
                        { productId: 'p3', product: null, quantity: 1, price: 1000 }
                    ]
                }
            ];

            prisma.order.findMany.mockResolvedValue(mockOrders);

            const result = await adminService.getSalesData();

            expect(result.totalRevenue).toBe(1000);
            expect(result.productSales[0].name).toBe('削除された商品');
            expect(result.productSales[0].revenue).toBe(1000);
        });
    });

    describe('getOrders', () => {
        it('すべての注文履歴が取得できること', async () => {
            prisma.order.findMany.mockResolvedValue([{ id: 'o1' }]);
            const result = await adminService.getOrders();
            expect(result.length).toBe(1);
            expect(prisma.order.findMany).toHaveBeenCalled();
        });
    });

    describe('getInquiries', () => {
        it('すべてのお問い合わせ情報が取得できること', async () => {
            prisma.inquiry = { findMany: jest.fn().mockResolvedValue([{ id: 'i1' }]) };
            const result = await adminService.getInquiries();
            expect(result.length).toBe(1);
            expect(prisma.inquiry.findMany).toHaveBeenCalled();
        });
    });
});
