import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000").transform(Number),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_CALLBACK_URL: z.string().url("GOOGLE_CALLBACK_URL must be a valid URL"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // Google Gemini AI
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),

  // Groq AI
  GROQ_API_KEY: z.string().optional().default(""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  
  console.error("  FATAL: Invalid environment variables");
  
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  ✗ ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsedEnv.data;