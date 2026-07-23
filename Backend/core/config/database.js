import mongoose from "mongoose";
import { env } from "./env.js";
import logger from "../logger/logger.js";

export const connectDatabase = async () => {
  const primaryUri = env.MONGODB_URI || process.env.MONGODB_URI;
  const fallbackUri = "mongodb://127.0.0.1:27017/whiteboard";

  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  try {
    logger.info("Attempting MongoDB connection...", { primaryUri: primaryUri?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@") });
    await mongoose.connect(primaryUri, options);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.warn("Primary MongoDB connection failed, attempting fallback connection...", { error: error.message });
    try {
      await mongoose.connect(fallbackUri, options);
      logger.info("MongoDB connected successfully via fallback URI");
    } catch (fallbackError) {
      logger.error("Error connecting to MongoDB:", { primaryError: error.message, fallbackError: fallbackError.message });
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected successfully");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", { error: error.message });
  }
};

export const connectionDB = connectDatabase;
export default connectDatabase;