const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('admin1234', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
        },
    });

    const products = [
        {
            name: 'セキュアなTシャツ',
            description: 'SQLインジェクションを防ぐ特殊素材ですが、物理的な穴があります。',
            price: 3000,
            stock: 50,
            imageUrl: '/images/hole-shirt.png',
        },
        {
            name: '堅牢なマグカップ',
            description: 'XSSを通さないコーティング済みですが、底に大きな穴が空いています。',
            price: 1500,
            stock: 100,
            imageUrl: '/images/hole-mug.png',
        },
        {
            name: '透過的ファイアウォール・パンツ',
            description: 'すべてのトラフィック（風）を透過させる先進的な穴あきデザイン。',
            price: 8000,
            stock: 30,
            imageUrl: '/images/hole-pants.png',
        },
        {
            name: 'ゼロトラスト・スニーカー',
            description: '足元からの侵入すら信用しないため、底が最初からありません。',
            price: 12000,
            stock: 20,
            imageUrl: '/images/hole-sneakers.png',
        },
        {
            name: '暗号化エンドツーエコバッグ',
            description: '通信は秘匿されますが、物理的な底の穴から中身が漏洩します。',
            price: 500,
            stock: 200,
            imageUrl: '/images/hole-ecobag.png',
        },
        {
            name: '分散ネットワーク傘',
            description: '雨粒を分散させる画期的なフレーム構造（布はありません）。',
            price: 3500,
            stock: 40,
            imageUrl: '/images/hole-umbrella.png',
        },
        {
            name: 'ステートレス・バケツ',
            description: '状態（水）を一切保持しない最高峰のセキュアな設計。',
            price: 1200,
            stock: 80,
            imageUrl: '/images/hole-bucket.png',
        },
        {
            name: 'マルチスレッド・マフラー',
            description: '並行処理により糸が絡まり、至る所がほつれたマフラー。',
            price: 4000,
            stock: 60,
            imageUrl: '/images/hole-scarf.png',
        },
        {
            name: 'パブリッククラウド・テント',
            description: '誰でもどこからでもアクセス可能なフルオープン設計のテント。',
            price: 15000,
            stock: 10,
            imageUrl: '/images/hole-tent.png',
        },
        {
            name: 'フォールトトレラント・グラス',
            description: '一部が破損（大穴）していても、コップとしての存在は維持されます。',
            price: 2000,
            stock: 90,
            imageUrl: '/images/hole-glass.png',
        },
        {
            name: 'キャッシュクリア・ウォレット',
            description: 'キャッシュ（現金）を自動でクリア（排出）する革新的な財布。',
            price: 9000,
            stock: 15,
            imageUrl: '/images/hole-wallet.png',
        },
        {
            name: 'デッドロック・パーカー',
            description: '左右のジッパーが永久に競合して閉まらない状態に陥っています。',
            price: 6500,
            stock: 45,
            imageUrl: '/images/hole-hoodie.png',
        }
    ];

    console.log('Inserting products...');
    for (const p of products) {
        await prisma.product.create({ data: p });
    }

    console.log('Seed data created successfully.');
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
