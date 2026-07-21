import mongoose from "mongoose";
import { env } from "./env.js";
import logger from "../logger/logger.js";

export const connectDatabase = async () => {
  try {
    const mongoUri = env.MONGODB_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {});
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", { error: error.message });
    throw error;
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