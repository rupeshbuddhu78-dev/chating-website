const path = require('path');
const multer = require('multer');
const { v4: uuid } = require('uuid');

const MAX = (Number(process.env.MAX_IMAGE_KB) || 350) * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 5);
    cb(null, `${Date.now()}-${uuid()}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!ok.includes(file.mimetype)) return cb(new Error('Only images allowed'));
  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX }
});
