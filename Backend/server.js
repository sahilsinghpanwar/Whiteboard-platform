import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import app from "./app.js";
import { env } from "./core/config/env.js";
import logger from "./core/logger/logger.js";
import { connectDatabase, disconnectDatabase } from "./core/config/database.js";

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
});

app.set("io", io);
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


const startServer = async () => {
  await connectDatabase();

  httpServer.listen(env.PORT, () => {
    logger.info("Server started", {
      port: env.PORT,
      environment: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
    });
  });
};

startServer();