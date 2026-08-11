/**
 * User Service
 * ユーザー情報の取得とプロフィール更新のデータベース操作を担当する
 */
const bcrypt = require('bcrypt');
const prisma = require('../db');
const AppError = require('../utils/AppError');

/**
 * ユーザーIDを指定してユーザー情報を取得する（パスワードハッシュは除外）
 * @param {string} userId - 取得したいユーザーのID
 */
const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, address: true, role: true, createdAt: true, securityQuestion: true }
    });
    if (!user) throw new AppError('ユーザーが見つかりません', 404);
    return user;
};

/**
 * ユーザーのプロフィール情報（名前、住所、メール、パスワード）を更新する
 * @param {string} userId - 更新対象のユーザーID
 * @param {Object} data - 更新内容
 * @throws {Error} メールアドレスが既に他のユーザーに使われている場合
 */
const updateProfile = async (userId, data) => {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;

    // メールアドレスの変更要求がある場合、重複チェックを行う
    if (data.email) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        // 自分以外のユーザーが既にそのアドレスを使用している場合はエラー
        if (existingUser && existingUser.id !== userId) {
            throw new AppError('このメールアドレスは既に他のユーザーに使用されています', 400);
        }
        updateData.email = data.email;
    }

    // パスワードの変更要求がある場合は、ハッシュ化して保存する
    if (data.password && data.password.trim() !== '') {
        updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    if (data.securityQuestion) {
        updateData.securityQuestion = data.securityQuestion;
    }

    if (data.securityAnswer && data.securityAnswer.trim() !== '') {
        updateData.securityAnswer = await bcrypt.hash(data.securityAnswer, 10);
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, name: true, address: true, role: true }
    });

    return user;
};

module.exports = {
    getUserById,
    updateProfile
};
