/**
 * Dynamic CORS configuration for Prof. S.N. Bose Boys Hostel Server.
 * Supports production deployment on Render with frontend hosted on Vercel,
 * while maintaining local development support (localhost:5173).
 */

export const getAllowedOrigins = () => {
  const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (!process.env.CLIENT_URL) {
    return localOrigins;
  }

  // Parse comma-separated CLIENT_URL entries and strip trailing slashes
  const configuredOrigins = process.env.CLIENT_URL.split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return Array.from(new Set([...localOrigins, ...configuredOrigins]));
};

export const isOriginAllowed = (origin) => {
  // Allow server-to-server, curl, Postman, or health checks without Origin header
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/$/, '');
  const allowed = getAllowedOrigins();

  if (allowed.includes(normalized)) {
    return true;
  }

  // Automatically allow any Vercel deployment preview / production domain
  try {
    const url = new URL(normalized);
    if (url.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch {
    // Ignore invalid URL format
  }

  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export default corsOptions;
