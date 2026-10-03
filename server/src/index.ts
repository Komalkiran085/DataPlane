import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import schemaRoutes from './routes/schemaRoutes';
import agentRoutes from './routes/agentRoutes';
import planRoutes from './routes/planRoutes';
import migrationRoutes from './routes/migrationRoutes';
import logRoutes from './routes/logRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  // Logging in development
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'DataPlane API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount modular routes
app.use('/api/schemas', schemaRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/logs', logRoutes);

// In production, serve the built client bundle
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('DataPlane Backend API is running. Client build not found.');
    }
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 DataPlane Server running on http://localhost:${PORT}`);
  });
}

export default app;
