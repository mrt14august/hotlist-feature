import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { connectDatabase } from './db/mongo';
import { connectRedis } from './db/redis';
import { requestLogger } from './middleware';
import { errorHandler } from './middleware/errorHandler';
import myListRoutes from './routes/myListRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/mylist', myListRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize and start server
const startServer = async () => {
  try {
    await connectDatabase();
    console.log('✓ Database connected  PORT:', process.env.MONGO_PORT || 27017);

    await connectRedis();
    console.log('✓ Redis connected  PORT:', process.env.REDIS_PORT || 6379);

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

export default app;
