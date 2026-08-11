/**
 * Upload Routes
 * 画像アップロード機能のAPIエンドポイントを定義する
 * ベースURL: /api/upload
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// セキュアなストレージ設定（UUIDでのファイル名生成と拡張子チェック）
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // フロントエンドのpublicディレクトリに直接保存する（本番環境ではS3などが望ましい）
        cb(null, path.join(__dirname, '../../../client/public/images'));
    },
    filename: (req, file, cb) => {
        // 拡張子を取得（.jpg, .pngなど）
        const ext = path.extname(file.originalname).toLowerCase();
        // セキュア: UUIDを使用して予測不可能で安全なファイル名にする
        cb(null, `${uuidv4()}${ext}`);
    }
});

// ファイルフィルタリング（MIMEタイプと拡張子で厳格にチェック）
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('画像ファイル（JPG, PNG, WEBP, GIF）のみアップロード可能です'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB制限
    }
});

// 画像アップロードは管理者のみ可能とする
router.post('/image', authenticate, authorizeAdmin, (req, res) => {
    // multerのエラーハンドリングをラップする
    const uploadSingle = upload.single('image');
    
    uploadSingle(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'ファイルが選択されていません' });
        }

        // 保存されたファイルの相対パス（フロントエンドから見えるパス）を返す
        const imageUrl = `/images/${req.file.filename}`;
        res.status(201).json({ imageUrl });
    });
});

module.exports = router;
