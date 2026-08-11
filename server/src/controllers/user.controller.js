/**
 * User Controller
 * ユーザーのプロフィール情報の取得や更新を担当するコントローラー
 */
const userService = require('../services/user.service');
const { updateProfileSchema } = require('../schemas/user.schema');

/**
 * ログイン中ユーザー自身のプロフィール情報を取得する
 */
const getMe = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * ログイン中ユーザー自身のプロフィール情報を更新する
 */
const updateMe = async (req, res, next) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const user = await userService.updateProfile(req.user.userId, data);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMe,
    updateMe
};
