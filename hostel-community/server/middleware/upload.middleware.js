import multer from 'multer';
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS, DANGEROUS_EXTENSIONS } from '../utils/fileValidator.js';
import path from 'path';

// Use memory storage so we can validate magic bytes on buffer before writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    const error = new Error(`File upload rejected: Executable and script files (${ext}) are prohibited.`);
    error.statusCode = 400;
    return cb(error, false);
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(`Unsupported file type '${ext}'. Allowed types: JPG, JPEG, PNG, WEBP, PDF.`);
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5 MB
    files: 1,
  },
  fileFilter,
});

/**
 * Express middleware wrapping multer single file upload with clean error responses.
 */
export const uploadAttachmentMiddleware = (req, res, next) => {
  const singleUpload = upload.single('file');

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum allowed limit of 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'File upload failed.',
      });
    }

    next();
  });
};

export default uploadAttachmentMiddleware;
