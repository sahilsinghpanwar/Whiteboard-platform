import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}] ${stack || message}${metaString}`;
  })
);

const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "warn" : "debug",
  format: env.NODE_ENV === "production" ? productionFormat : developmentFormat,
  defaultMeta: { service: "whiteboard-api" },
  transports: [
    new winston.transports.Console(),
  ],
  
  exitOnError: false,
});

export default logger;