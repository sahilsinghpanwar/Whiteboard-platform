import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';
import { env }             from './core/config/env.js';
import { logger }          from './core/logger/logger.js';
import { errorMiddleware } from './core/middleware/error.middleware.js';
import { authRouter }   from './modules/auth/index.js';
import { userRouter }   from './modules/user/index.js';
import { boardRouter }  from './modules/board/index.js';
import { chatRouter }   from './modules/chat/index.js';
import { aiRouter }     from './modules/ai/index.js';
import { exportRouter } from './modules/export/index.js';
import { uploadRouter } from './modules/upload/index.js';
import './modules/auth/google.strategy.js';

const app = express();

app.use(
  cors({
    origin:      [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
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

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', environment: env.NODE_ENV });
});

app.use('/api/v1/auth',   authRouter);
app.use('/api/v1/users',  userRouter);
app.use('/api/v1/boards', boardRouter);

app.use('/api/v1/boards/:boardId/chat',   chatRouter);
app.use('/api/v1/boards/:boardId/ai',     aiRouter);
app.use('/api/v1/boards/:boardId/export', exportRouter);

app.use('/api/v1/upload', uploadRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

export default app;