/**
 * Auth Service
 * 認証（登録・ログイン・トークン発行）に関するビジネスロジックを担当する
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * 新規ユーザーをデータベースに登録する
 * @param {string} email - メールアドレス
 * @param {string} password - 平文のパスワード
 * @param {string} name - ユーザー名
 * @param {string} address - 住所
 * @param {string} securityQuestion - 秘密の質問
 * @param {string} securityAnswer - 秘密の答え
 * @returns {Object} 作成されたユーザー情報
 * @throws {Error} 既にメールアドレスが登録されている場合
 */
const register = async (email, password, name, address, securityQuestion, securityAnswer) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        logger.warn(`Register failed: Email already exists - ${email}`, { category: 'auth', action: 'register_failed_exists', email });
        throw new AppError('このメールアドレスは既に登録されています', 400);
    }

    // パスワードと秘密の答えをハッシュ化して安全に保存
    const passwordHash = await bcrypt.hash(password, 12);
    const securityAnswerHash = securityAnswer ? await bcrypt.hash(securityAnswer, 10) : null;
    
    const user = await prisma.user.create({ 
        data: { 
            email, 
            passwordHash, 
            name, 
            address,
            securityQuestion: securityQuestion || 'あなたの出身地は？',
            securityAnswer: securityAnswerHash
        } 
    });
    
    logger.info(`User registered successfully: ${user.id} (${email})`, { category: 'auth', action: 'register_success', userId: user.id, email });
    return user;
};

/**
 * メールアドレスとパスワードでログイン認証を行う
 * @param {string} email - メールアドレス
 * @param {string} password - 入力されたパスワード
 * @returns {Object} { token: JWTトークン, role: ユーザーの権限 }
 * @throws {Error} 認証に失敗した場合
 */
const login = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });

    // ユーザーが存在しない、またはパスワードが一致しない場合はエラー
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        logger.warn(`Login failed: Invalid credentials for email ${email}`, { category: 'auth', action: 'login_failed', email });
        throw new AppError('メールアドレスまたはパスワードが間違っています', 401);
    }

    // 認証成功時、JWTトークンを発行（1時間有効）
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    
    logger.info(`Successful login for user: ${user.id}`, { category: 'auth', action: 'login_success', userId: user.id });
    return { token, role: user.role };
};

/**
 * パスワード再設定用の「秘密の質問」を取得する
 * @param {string} email - ユーザーのメールアドレス
 */
const getSecurityQuestion = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        logger.warn(`Security question requested for non-existent user: ${email}`, { category: 'auth', action: 'security_question_failed_not_found', email });
        throw new AppError('ユーザーが見つかりません', 404);
    }
    return {
        email: user.email,
        question: user.securityQuestion
    };
};

/**
 * 秘密の答えを検証し、パスワードを再設定する
 * @param {string} email - ユーザーのメールアドレス
 * @param {string} answer - 秘密の質問の答え
 * @param {string} newPassword - 新しいパスワード
 */
const resetPassword = async (email, answer, newPassword) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        logger.warn(`Password reset failed: Non-existent user - ${email}`, { category: 'auth', action: 'reset_password_failed_not_found', email });
        throw new AppError('ユーザーが見つかりません', 404);
    }

    // 答えの検証（ハッシュ比較）
    const isAnswerValid = await bcrypt.compare(answer, user.securityAnswer);
    if (!isAnswerValid) {
        logger.warn(`Password reset failed: Incorrect security answer for email - ${email}`, { category: 'auth', action: 'reset_password_failed_wrong_answer', email });
        throw new AppError('秘密の質問の答えが間違っています', 400);
    }

    // 新しいパスワードをハッシュ化して保存
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { email },
        data: { passwordHash: newPasswordHash }
    });

    logger.info(`Password reset successfully for email: ${email}`, { category: 'auth', action: 'reset_password_success', email });
    return { message: 'パスワードを再設定しました' };
};

module.exports = {
    register,
    login,
    getSecurityQuestion,
    resetPassword
};
