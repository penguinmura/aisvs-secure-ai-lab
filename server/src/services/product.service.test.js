const prisma = require('../db');
const productService = require('./product.service');

jest.mock('../db', () => ({
    product: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
    },
    cartItem: {
        deleteMany: jest.fn()
    },
    review: {
        deleteMany: jest.fn(),
        create: jest.fn()
    },
    orderItem: {
        deleteMany: jest.fn()
    },
    $transaction: jest.fn(async (cb) => {
        return await cb(require('../db'));
    })
}));

describe('Product Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProducts', () => {
        it('検索キーワードなしですべての商品と平均評価が取得できること', async () => {
            prisma.product.findMany.mockResolvedValue([
                { id: 'p1', name: 'A', reviews: [{ rating: 4 }, { rating: 5 }] },
                { id: 'p2', name: 'B', reviews: [] }
            ]);
            const result = await productService.getProducts();
            expect(result[0].averageRating).toBe(4.5);
            expect(result[0].reviewsCount).toBe(2);
            expect(result[1].averageRating).toBe(0);
        });
        it('キーワード指定時に正しく検索条件が渡されること', async () => {
            prisma.product.findMany.mockResolvedValue([]);
            await productService.getProducts('キーワード');
            expect(prisma.product.findMany).toHaveBeenCalledWith({
                where: { name: { contains: 'キーワード' } },
                include: { reviews: { select: { rating: true } } }
            });
        });
    });

    describe('getProductById', () => {
        it('存在する商品IDを指定した場合、詳細が返されること', async () => {
            prisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'A' });
            const result = await productService.getProductById('p1');
            expect(result.name).toBe('A');
        });
        it('存在しない商品IDの場合はエラーになること', async () => {
            prisma.product.findUnique.mockResolvedValue(null);
            await expect(productService.getProductById('nonexistent')).rejects.toThrow('商品が見つかりません');
        });
    });

    describe('createReview', () => {
        it('レビューが正しく作成されること', async () => {
            prisma.review.create.mockResolvedValue({ id: 'r1' });
            await productService.createReview('p1', 'u1', 5, 'Good');
            expect(prisma.review.create).toHaveBeenCalledWith({ data: { rating: 5, comment: 'Good', productId: 'p1', userId: 'u1' } });
        });
    });

    describe('updateProduct', () => {
        it('指定したデータで商品情報が更新されること', async () => {
            prisma.product.update.mockResolvedValue({ id: 'p1', name: 'New' });
            await productService.updateProduct('p1', { name: 'New' });
            expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { name: 'New' } });
        });
    });

    describe('createProduct', () => {
        it('入力データに基づいて商品が正しく作成されること', async () => {
            // 【確認内容】
            // 商品追加機能において、名前や価格などのデータがPrismaのcreateメソッドに渡され、
            // 新しい商品としてデータベースに登録されるかを確認します。
            const mockData = { name: 'テスト商品', price: 1000, stock: 10 };
            const mockCreatedProduct = { id: 'p1', ...mockData };
            
            prisma.product.create.mockResolvedValue(mockCreatedProduct);

            const result = await productService.createProduct(mockData);

            expect(prisma.product.create).toHaveBeenCalledWith({ data: mockData });
            expect(result).toEqual(mockCreatedProduct);
        });
    });

    describe('deleteProduct', () => {
        it('関連データがカスケード削除された上で、商品本体が削除されること', async () => {
            // 【確認内容】
            // 商品を削除する際、外部キー制約エラーを避けるために
            // トランザクション内でカートアイテム、レビュー、注文明細の関連データが先に削除(deleteMany)され、
            // その最後に商品本体が削除(delete)されるという順序・ロジックが正しいかを確認します。
            const productId = 'p1';

            await productService.deleteProduct(productId);

            expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { productId } });
            expect(prisma.review.deleteMany).toHaveBeenCalledWith({ where: { productId } });
            expect(prisma.orderItem.deleteMany).toHaveBeenCalledWith({ where: { productId } });
            expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: productId } });
        });
    });
});
