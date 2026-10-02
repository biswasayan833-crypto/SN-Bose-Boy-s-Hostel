import path from 'path';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Dangerous executable and script extensions strictly prohibited
export const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.js',
  '.mjs',
  '.vbs',
  '.ps1',
  '.com',
  '.scr',
  '.msi',
  '.php',
  '.phtml',
  '.py',
  '.rb',
  '.jar',
  '.bin',
  '.dll',
];

/**
 * Verify buffer contents using magic bytes (file signature detection).
 * Prevents MIME-spoofing attacks where executables or text are disguised as images.
 */
export const detectBufferType = (buffer) => {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { mime: 'application/pdf', ext: '.pdf' };
  }

  return null;
};

/**
 * Validate an uploaded file against size, extension, MIME type, and binary magic bytes.
 */
export const validateUploadFile = (file) => {
  if (!file) {
    const error = new Error('No file provided for upload.');
    error.statusCode = 400;
    throw error;
  }

  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();

  // 1. Check dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    const error = new Error(`File upload rejected: Executable and script files (${ext}) are strictly prohibited.`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Check allowed extensions
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(
      `Unsupported file type '${ext}'. Allowed types: JPG, JPEG, PNG, WEBP, PDF.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Check declared MIME type
  const clientMime = (file.mimetype || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(clientMime)) {
    const error = new Error(
      `Unsupported MIME type '${clientMime}'. Allowed types: image/jpeg, image/png, image/webp, application/pdf.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Check file size
  if (file.size > MAX_FILE_SIZE) {
    const error = new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 5 MB.`);
    error.statusCode = 400;
    throw error;
  }

  // 5. Deep inspection: Validate magic bytes to prevent MIME spoofing
  if (file.buffer) {
    const detected = detectBufferType(file.buffer);
    if (!detected) {
      const error = new Error('File validation failed: File content does not match a valid JPG, PNG, WEBP, or PDF signature.');
      error.statusCode = 400;
      throw error;
    }

    // Ensure detected MIME family matches declared extension
    if (detected.mime !== clientMime) {
      // Allow minor variations like image/jpeg with .jpg/.jpeg
      const isJpegFamily = (clientMime === 'image/jpeg' || clientMime === 'image/jpg') && detected.mime === 'image/jpeg';
      if (!isJpegFamily) {
        const error = new Error(`File validation failed: MIME type spoofing detected (claimed '${clientMime}', detected '${detected.mime}').`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  return true;
};

export default {
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  DANGEROUS_EXTENSIONS,
  detectBufferType,
  validateUploadFile,
};
