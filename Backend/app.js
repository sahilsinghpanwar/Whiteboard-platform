import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';

import { env } from './core/config/env.js';
import { logger } from './core/logger/logger.js';
import { errorMiddleware } from './core/middleware/error.middleware.js';

import { authRouter } from './modules/auth/index.js';
import { boardRouter } from './modules/board/index.js';
import './modules/auth/google.strategy.js';

const app = express();

app.use(
  cors({
    origin:      env.CLIENT_URL,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));       
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
app.use('/api/v1/boards', boardRouter);




app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

export default app;