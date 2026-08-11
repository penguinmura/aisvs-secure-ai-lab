const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authService = require('./auth.service');

jest.mock('../db', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    }
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn()
}));

describe('Auth Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('register', () => {
        it('新規ユーザーがパスワードをハッシュ化して登録されること', async () => {
            // 【確認内容】
            // 新規登録時に、平文のパスワードがbcryptで安全にハッシュ化され、
            // そのハッシュ値を用いてユーザーが作成されるかを確認します。
            prisma.user.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValueOnce('hashed_password').mockResolvedValueOnce('hashed_answer');
            prisma.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' });

            const result = await authService.register('test@example.com', 'password123', 'Name', 'Address', 'Q', 'A');

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    email: 'test@example.com',
                    passwordHash: 'hashed_password',
                    securityAnswer: 'hashed_answer'
                })
            }));
            expect(result.id).toBe('u1');
        });

        it('秘密の質問と答えが省略された場合、デフォルト値とnullが設定されること', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed_password');
            prisma.user.create.mockResolvedValue({ id: 'u2' });

            await authService.register('test2@example.com', 'password', 'Name', 'Add', null, null);

            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    securityQuestion: 'あなたの出身地は？',
                    securityAnswer: null
                })
            }));
        });

        it('既に使用されているメールアドレスの場合はエラーになること', async () => {
            // 【確認内容】
            // 既に登録済みのメールアドレスを指定した場合、重複エラーとして正しく処理が中断されるかを確認します。
            prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
            await expect(authService.register('test@example.com', 'pass', 'Name', 'Add', 'Q', 'A'))
                .rejects.toThrow('このメールアドレスは既に登録されています');
        });
    });

    describe('login', () => {
        it('正しいパスワードの場合にJWTトークンが発行されること', async () => {
            // 【確認内容】
            // メールアドレスが存在し、パスワードが一致した場合に、
            // jwt.sign によって認証トークン（JWT）が正しく発行されて返されるかを確認します。
            prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'USER', passwordHash: 'hash' });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-token');

            const result = await authService.login('test@example.com', 'password');

            expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
            expect(jwt.sign).toHaveBeenCalledWith({ userId: 'u1', role: 'USER' }, 'test-secret', { expiresIn: '1h' });
            expect(result.token).toBe('mock-token');
        });

        it('パスワードが間違っている場合はエラーになること', async () => {
            // 【確認内容】
            // パスワードのハッシュ比較が失敗した場合に、ログイン失敗としてエラーがスローされるかを確認します。
            prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'hash' });
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.login('test@example.com', 'wrong-pass'))
                .rejects.toThrow('メールアドレスまたはパスワードが間違っています');
        });

        it('ユーザーが存在しない場合はエラーになること', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(authService.login('nonexistent@example.com', 'pass'))
                .rejects.toThrow('メールアドレスまたはパスワードが間違っています');
        });
    });

    describe('getSecurityQuestion', () => {
        it('存在するユーザーのメールアドレスを指定した場合、秘密の質問が返されること', async () => {
            prisma.user.findUnique.mockResolvedValue({ email: 'test@example.com', securityQuestion: 'Q1' });
            const result = await authService.getSecurityQuestion('test@example.com');
            expect(result.question).toBe('Q1');
        });

        it('存在しないユーザーのメールアドレスを指定した場合、エラーになること', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(authService.getSecurityQuestion('unknown@example.com'))
                .rejects.toThrow('ユーザーが見つかりません');
        });
    });

    describe('resetPassword', () => {
        it('正しい答えを入力した場合、新しいパスワードが設定されること', async () => {
            prisma.user.findUnique.mockResolvedValue({ email: 'test@example.com', securityAnswer: 'hash-ans' });
            bcrypt.compare.mockResolvedValue(true); // 答えが一致
            bcrypt.hash.mockResolvedValue('new-hash'); // 新しいパスワードのハッシュ
            prisma.user.update.mockResolvedValue({});

            const result = await authService.resetPassword('test@example.com', 'Answer', 'newPass');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                data: { passwordHash: 'new-hash' }
            });
            expect(result.message).toBe('パスワードを再設定しました');
        });

        it('間違った答えを入力した場合、エラーになること', async () => {
            prisma.user.findUnique.mockResolvedValue({ email: 'test@example.com', securityAnswer: 'hash-ans' });
            bcrypt.compare.mockResolvedValue(false); // 答えが不一致

            await expect(authService.resetPassword('test@example.com', 'Wrong', 'newPass'))
                .rejects.toThrow('秘密の質問の答えが間違っています');
        });

        it('存在しないユーザーのメールアドレスを指定した場合、エラーになること', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(authService.resetPassword('unknown@example.com', 'Ans', 'newPass'))
                .rejects.toThrow('ユーザーが見つかりません');
        });
    });
});
