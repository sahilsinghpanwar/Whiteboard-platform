import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';

import { env }             from './core/config/env.js';
import { logger }          from './core/logger/logger.js';
import { errorMiddleware } from './core/middleware/error.middleware.js';

// ── Module routers ────────────────────────────────────────────────────────
import { authRouter }   from './modules/auth/index.js';
import { userRouter }   from './modules/user/index.js';
import { boardRouter }  from './modules/board/index.js';
import { chatRouter }   from './modules/chat/index.js';
import { aiRouter }     from './modules/ai/index.js';
import { exportRouter } from './modules/export/index.js';
import { uploadRouter } from './modules/upload/index.js';

// ── Passport strategy (Google OAuth) ─────────────────────────────────────
import './modules/auth/google.strategy.js';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────
app.use(
  cors({
    origin:      env.CLIENT_URL,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

if (env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', environment: env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/v1/auth',   authRouter);
app.use('/api/v1/users',  userRouter);
app.use('/api/v1/boards', boardRouter);

// Nested under boards — mergeParams in each sub-router picks up :boardId
app.use('/api/v1/boards/:boardId/chat',   chatRouter);
app.use('/api/v1/boards/:boardId/ai',     aiRouter);
app.use('/api/v1/boards/:boardId/export', exportRouter);

// Standalone upload route
app.use('/api/v1/upload', uploadRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler (MUST be last) ─────────────────────────────────
app.use(errorMiddleware);

export default app;