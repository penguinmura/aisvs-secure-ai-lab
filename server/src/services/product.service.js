/**
 * Product Service
 * 商品の取得、登録、編集、削除、およびレビューのデータベース操作を担当する
 */
const prisma = require('../db');
const AppError = require('../utils/AppError');

/**
 * すべての商品一覧を取得し、各商品の平均評価とレビュー件数を計算して返す
 * @param {string} [keyword] - 検索キーワード（任意）
 */
const getProducts = async (keyword) => {
    // 検索条件を構築（キーワードが指定されていれば、nameカラムに対する曖昧検索を行う）
    const whereClause = keyword ? {
        name: { contains: keyword }
    } : {};

    const products = await prisma.product.findMany({
        where: whereClause,
        include: {
            reviews: { select: { rating: true } }
        }
    });

    return products.map(product => {
        const reviewsCount = product.reviews.length;
        // レビューが存在すれば平均値を計算し、なければ0とする
        const averageRating = reviewsCount > 0
            ? product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount
            : 0;
            
        return {
            ...product,
            reviewsCount,
            averageRating: Number(averageRating.toFixed(1))
        };
    });
};

/**
 * IDを指定して商品の詳細と紐づくレビュー一覧を取得する
 * @param {string} productId - 取得したい商品のID
 */
const getProductById = async (productId) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            reviews: {
                include: { user: { select: { id: true, email: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!product) throw new AppError('商品が見つかりません', 404);
    return product;
};

/**
 * 特定の商品に対してレビュー（評価とコメント）を保存する
 */
const createReview = async (productId, userId, rating, comment) => {
    return prisma.review.create({
        data: { rating, comment, productId, userId },
    });
};

// ==========================================
// 管理者（Admin）用アクション
// ==========================================

/**
 * 新しい商品をデータベースに登録する
 */
const createProduct = async (data) => {
    return prisma.product.create({ data });
};

/**
 * 既存の商品の情報を更新する
 */
const updateProduct = async (productId, data) => {
    return prisma.product.update({
        where: { id: productId },
        data
    });
};

/**
 * 指定した商品を削除する
 * カート、レビュー、注文履歴など関連するデータもトランザクションで安全に一括削除する
 * @param {string} productId - 削除したい商品のID
 */
const deleteProduct = async (productId) => {
    return prisma.$transaction(async (tx) => {
        // 商品が削除されると制約違反になるため、関連レコードを先に削除する
        await tx.cartItem.deleteMany({ where: { productId } });
        await tx.review.deleteMany({ where: { productId } });
        await tx.orderItem.deleteMany({ where: { productId } });
        
        // 最後に本体を削除
        await tx.product.delete({ where: { id: productId } });
    });
};

module.exports = {
    getProducts,
    getProductById,
    createReview,
    createProduct,
    updateProduct,
    deleteProduct
};
