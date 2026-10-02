import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for local file storage: server/uploads/attachments
export const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'attachments');

// Ensure upload directory exists synchronously on initialization
export const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  return UPLOAD_DIR;
};

// Initialize immediately
ensureUploadDir();

/**
 * Validate that a storedName does not escape the upload directory (path traversal protection).
 */
export const isPathSafe = (storedName) => {
  if (!storedName || typeof storedName !== 'string') return false;
  // Disallow directory separators and parent directory tokens
  if (storedName.includes('/') || storedName.includes('\\') || storedName.includes('..')) {
    return false;
  }
  const fullPath = path.resolve(UPLOAD_DIR, storedName);
  return fullPath.startsWith(UPLOAD_DIR);
};

/**
 * Sanitize original filename for safe storage metadata and header display.
 */
export const sanitizeOriginalName = (name) => {
  if (!name || typeof name !== 'string') return 'attachment';
  // Strip paths, control chars, quotes, and non-printable characters
  const basename = path.basename(name).replace(/[\r\n\t"<>:|?*]/g, '_').trim();
  return basename.slice(0, 100) || 'attachment';
};

/**
 * Save an uploaded file buffer to isolated storage.
 * Generates an unguessable unique stored filename.
 */
export const saveAttachment = async ({ buffer, originalName, mimeType }) => {
  ensureUploadDir();

  const safeOriginalName = sanitizeOriginalName(originalName);
  const ext = path.extname(safeOriginalName).toLowerCase() || '.bin';
  const randomPrefix = crypto.randomBytes(16).toString('hex');
  const storedName = `${Date.now()}-${randomPrefix}${ext}`;

  if (!isPathSafe(storedName)) {
    throw new Error('Invalid stored filename generated.');
  }

  const filePath = path.resolve(UPLOAD_DIR, storedName);
  await fs.promises.writeFile(filePath, buffer);

  return {
    storedName,
    originalName: safeOriginalName,
    mimeType,
    size: buffer.length,
    path: filePath,
  };
};

/**
 * Get safe absolute path to a stored attachment.
 * Throws error if path is unsafe or file does not exist.
 */
export const getAttachmentPath = (storedName) => {
  if (!isPathSafe(storedName)) {
    const error = new Error('Access denied: Invalid filename path.');
    error.statusCode = 400;
    throw error;
  }

  const filePath = path.resolve(UPLOAD_DIR, storedName);
  if (!fs.existsSync(filePath)) {
    const error = new Error('Attachment file not found on disk.');
    error.statusCode = 404;
    throw error;
  }

  return filePath;
};

/**
 * Delete a stored attachment file from disk.
 */
export const deleteAttachmentFile = async (storedName) => {
  try {
    if (!isPathSafe(storedName)) return false;
    const filePath = path.resolve(UPLOAD_DIR, storedName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    // Non-blocking cleanup error
  }
  return false;
};

export default {
  UPLOAD_DIR,
  ensureUploadDir,
  isPathSafe,
  sanitizeOriginalName,
  saveAttachment,
  getAttachmentPath,
  deleteAttachmentFile,
};
