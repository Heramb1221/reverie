import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { startCronJobs } from './modules/notification/cron.js';

import { authRouter } from './modules/auth/auth.routes.js';
import { journalRouter } from './modules/journal/journal.routes.js';
import { reflectionRouter } from './modules/reflection/reflection.routes.js';
import { capsuleRouter } from './modules/capsule/capsule.routes.js';
import {
  searchRouter,
  uploadRouter,
  userRouter,
} from './modules/misc.routes.js';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:8081',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Mobile-Client'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: env.NODE_ENV,
  });
});

const API = '/api/v1';
app.use(`${API}/auth`,        authRouter);
app.use(`${API}/journal`,     journalRouter);
app.use(`${API}/reflection`,  reflectionRouter);
app.use(`${API}/capsules`,    capsuleRouter);
app.use(`${API}/search`,      searchRouter);
app.use(`${API}/upload`,      uploadRouter);
app.use(`${API}/user`,        userRouter);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDatabase();
  startCronJobs();

  const server = app.listen(env.PORT, () => {
    console.log(`\n Reverie API running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Client URL:  ${env.CLIENT_URL}`);
    console.log(`   API Base:    http://localhost:${env.PORT}/api/v1\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Graceful shutdown...`);
    server.close(async () => {
      const { disconnectDatabase } = await import('./config/database.js');
      await disconnectDatabase();
      const { stopCronJobs } = await import('./modules/notification/cron.js');
      stopCronJobs();
      console.log('Server closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
};

start().catch(console.error);

export default app;
