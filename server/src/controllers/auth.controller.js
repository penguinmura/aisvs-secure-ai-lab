/**
 * Auth Controller
 * ユーザーの新規登録とログイン（認証）を担当するコントローラー
 */
const authService = require('../services/auth.service');
const { registerSchema } = require('../schemas/auth.schema');

/**
 * 新規ユーザー登録処理
 * 入力値を検証し、問題なければユーザーを作成する
 */
const register = async (req, res, next) => {
    try {
        const { email, password, name, address, securityQuestion, securityAnswer } = registerSchema.parse(req.body);
        const user = await authService.register(email, password, name, address, securityQuestion, securityAnswer);
        res.status(201).json({ message: '登録完了', userId: user.id });
    } catch (error) {
        next(error);
    }
};

/**
 * ログイン処理
 * 認証に成功した場合はJWTトークンを発行する
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * パスワード再設定用の質問取得エンドポイント
 */
const getSecurityQuestion = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await authService.getSecurityQuestion(email);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * パスワード再設定エンドポイント
 */
const resetPassword = async (req, res, next) => {
    try {
        const { email, answer, newPassword } = req.body;
        const result = await authService.resetPassword(email, answer, newPassword);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getSecurityQuestion,
    resetPassword
};
