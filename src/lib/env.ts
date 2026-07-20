import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Database configuration
  DB_NAME: z.string().default("neighborlink"),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default("password"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.string().default("3306"),
  DB_SSL: z.enum(["true", "false"]).default("false"),
  
  // Redis configuration
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  
  // Meilisearch configuration
  MEILISEARCH_HOST: z.string().default("http://localhost:7700"),
  MEILISEARCH_API_KEY: z.string().default(""),
  
  // MinIO configuration
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.string().default("9000"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  
  // Auth configuration
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required").optional(),
  
  // SMS configuration
  SMS_PROVIDER_API_KEY: z.string().optional(),
  FORCE_DEV_OTP: z.enum(["true", "false"]).default("false"),
  
  // App configurations
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

// Perform validation
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables at application startup:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
export default env;
