import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import logger from "../logger/logger.js";

const normalizeMongooseError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return ApiError.conflict(`${field} already exists`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest("Validation failed", errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for field: ${err.path}`);
  }

  return null;
};


const errorMiddleware = (err, req, res, next) => {
  const mongooseError = normalizeMongooseError(err);
  if (mongooseError) {
    return errorMiddleware(mongooseError, req, res, next);
  }

  
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const isOperational = err instanceof ApiError ? err.isOperational : false;
  const errors = err instanceof ApiError ? err.errors : [];

 
  if (!isOperational || statusCode >= 500) {
    logger.error("Unhandled application error", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn("Operational error", {
      statusCode,
      message: err.message,
      url: req.originalUrl,
      method: req.method,
    });
  }

  const clientMessage =
    !isOperational && process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again later."
      : err.message;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: clientMessage,
    errors,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export { errorMiddleware };
export default errorMiddleware;