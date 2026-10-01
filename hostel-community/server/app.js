import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/api.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();


// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging in dev mode
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Prof. S.N. Bose Boys Hostel Community API',
    tagline: 'Your Hostel. Your Voice. Your Community.',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 and Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
