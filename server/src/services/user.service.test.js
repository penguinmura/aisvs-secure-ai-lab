const prisma = require('../db');
const bcrypt = require('bcrypt');
const userService = require('./user.service');

// 依存モジュールをモック化
jest.mock('../db', () => ({
    user: {
        findUnique: jest.fn(),
        update: jest.fn()
    }
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password_mock')
}));

describe('User Service Unit Tests', () => {
    // 各テストの前にモックの呼び出し履歴をリセット
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserById', () => {
        it('存在するユーザーIDを指定した場合、ユーザー情報が返されること', async () => {
            // 【確認内容】
            // PrismaのfindUniqueメソッドが「正しい引数（where句や必要なselect句）」で呼び出されているかと、
            // DBから取得したデータがそのまま関数の返り値として出力されるか（正常系ロジック）を確認します。

            // モックの返り値を設定
            const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User', role: 'USER' };
            prisma.user.findUnique.mockResolvedValue(mockUser);

            // 実行
            const result = await userService.getUserById('user-123');

            // 検証
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                select: { id: true, email: true, name: true, address: true, role: true, createdAt: true, securityQuestion: true }
            });
            expect(result).toEqual(mockUser);
        });

        it('存在しないユーザーIDを指定した場合、エラーがスローされること', async () => {
            // 【確認内容】
            // データベースにユーザーが存在せず null が返ってきた場合に、
            // サービス側で意図したエラー（'ユーザーが見つかりません'）が正しくスローされて処理が止まるかを確認します。

            // ユーザーが存在しない状態をモック
            prisma.user.findUnique.mockResolvedValue(null);

            // 実行と検証 (エラーがスローされることを期待)
            await expect(userService.getUserById('unknown-id')).rejects.toThrow('ユーザーが見つかりません');
        });
    });

    describe('updateProfile', () => {
        it('プロフィール情報（名前、住所）が正常に更新されること', async () => {
            // 【確認内容】
            // 引数で渡された更新データ（名前、住所など）が正しくPrismaのupdateメソッドに引き継がれているか、
            // およびDBの更新結果がそのまま返り値として取得できるかを確認します。

            const mockUpdatedUser = { id: 'user-123', name: 'Updated Name', address: 'Updated Address' };
            prisma.user.update.mockResolvedValue(mockUpdatedUser);

            const result = await userService.updateProfile('user-123', { name: 'Updated Name', address: 'Updated Address' });

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { name: 'Updated Name', address: 'Updated Address' },
                select: { id: true, email: true, name: true, address: true, role: true }
            });
            expect(result).toEqual(mockUpdatedUser);
        });

        it('メールアドレス、パスワード、秘密の質問と答えが正常に更新されること', async () => {
            prisma.user.findUnique.mockResolvedValue(null); // emailが他の誰にも使われていない
            prisma.user.update.mockResolvedValue({ id: 'u1' });
            
            await userService.updateProfile('user-123', {
                email: 'new@example.com',
                password: 'new-password',
                securityQuestion: 'Q2',
                securityAnswer: 'A2'
            });

            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    email: 'new@example.com',
                    passwordHash: 'hashed_password_mock',
                    securityQuestion: 'Q2',
                    securityAnswer: 'hashed_password_mock'
                })
            }));
        });

        it('他のユーザーが使用しているメールアドレスへの変更はエラーになること', async () => {
            // 【確認内容】
            // 変更しようとしているメールアドレスが「自分以外の別ユーザー」によって既にDBに登録されている場合、
            // 重複チェックのロジックが働き、適切なエラーメッセージがスローされて更新が阻止されるかを確認します。

            // 他のユーザーがそのアドレスを使用している状態をモック
            prisma.user.findUnique.mockResolvedValue({ id: 'other-user', email: 'used@example.com' });

            await expect(userService.updateProfile('user-123', { email: 'used@example.com' }))
                .rejects.toThrow('このメールアドレスは既に他のユーザーに使用されています');
        });
    });
});
