import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import app from "./app.js";
import { env } from "./core/config/env.js";
import logger from "./core/logger/logger.js";
import { connectDatabase, disconnectDatabase } from "./core/config/database.js";
import { configureSocketAuth } from "./core/config/socket.js";
import { registerCollaborationHandlers } from "./modules/collaboration/collaboration.socket.js";
import { registerChatHandlers } from "./modules/chat/chat.socket.js";

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
});

app.set("io", io);

// Configure authentication middleware for socket namespaces
configureSocketAuth(io);
configureSocketAuth(io.of("/collaboration"));
configureSocketAuth(io.of("/chat"));

// Register socket event handlers
registerCollaborationHandlers(io);
registerChatHandlers(io);

io.on("connection", (socket) => {
  logger.info("Socket client connected", { socketId: socket.id });

  socket.on("disconnect", (reason) => {
    logger.info("Socket client disconnected", {
      socketId: socket.id,
      reason,
    });
  });
});

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  httpServer.close(async () => {
    logger.info("HTTP server closed");

    try {
      await disconnectDatabase();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown", {
        error: error.message,
      });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", {
    reason: reason?.message || reason,
    promise,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception — shutting down", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

import { initGemini } from "./core/config/gemini.js";
import { initCloudinary } from "./core/config/cloudinary.js";

const startServer = async () => {
  try {
    await connectDatabase();
    initGemini();
    initCloudinary();
  } catch (err) {
    logger.warn("Database connection attempt failed. Ensure MongoDB is running or check MONGODB_URI in .env.", {
      error: err.message,
    });
  }

  httpServer.listen(env.PORT, () => {
    logger.info("Server started", {
      port: env.PORT,
      environment: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
    });
  });
};

startServer();