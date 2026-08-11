const prisma = require('../db');
const cartService = require('./cart.service');

jest.mock('../db', () => ({
    cartItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
    }
}));

describe('Cart Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCartItems', () => {
        it('特定ユーザーのカート内容が取得できること', async () => {
            const mockItems = [{ id: 'c1', productId: 'p1', quantity: 2, product: { name: 'A' } }];
            prisma.cartItem.findMany.mockResolvedValue(mockItems);

            const result = await cartService.getCartItems('u1');
            expect(prisma.cartItem.findMany).toHaveBeenCalledWith({
                where: { userId: 'u1' },
                include: { product: true }
            });
            expect(result).toEqual(mockItems);
        });
    });

    describe('addToCart', () => {
        it('既にカートにある商品の場合は数量が加算されること', async () => {
            prisma.cartItem.findUnique.mockResolvedValue({ id: 'c1', quantity: 2 });
            prisma.cartItem.update.mockResolvedValue({ id: 'c1', quantity: 5 });

            const result = await cartService.addToCart('u1', 'p1', 3);
            expect(prisma.cartItem.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: { quantity: 5 }
            });
            expect(result.quantity).toBe(5);
        });

        it('カートにない商品の場合は新規追加されること', async () => {
            prisma.cartItem.findUnique.mockResolvedValue(null);
            prisma.cartItem.create.mockResolvedValue({ id: 'c2', userId: 'u1', productId: 'p1', quantity: 3 });

            const result = await cartService.addToCart('u1', 'p1', 3);
            expect(prisma.cartItem.create).toHaveBeenCalledWith({
                data: { userId: 'u1', productId: 'p1', quantity: 3 }
            });
            expect(result.id).toBe('c2');
        });
    });
});
