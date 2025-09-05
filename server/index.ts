import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { prisma } from './prisma';
import testsRouter from './routes/tests';
import aiRouter from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ status: 'ERROR', database: 'disconnected' });
  }
});

// Routes
app.use('/api/tests', testsRouter);
app.use('/api/ai', aiRouter);

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: { 
      code: "INTERNAL_ERROR", 
      message: "Errore interno del server" 
    } 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: { 
      code: "NOT_FOUND", 
      message: "Endpoint non trovato" 
    } 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});