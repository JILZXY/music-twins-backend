import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // PostgreSQL Database
  PG_HOST: z.string(),
  PG_PORT: z.coerce.number().default(5432),
  PG_USER: z.string(),
  PG_PASSWORD: z.string(),
  PG_DATABASE: z.string(),

  // MongoDB Database
  MONGO_URI: z.string().url(),
  MONGO_DATABASE: z.string(),

  // JWT
  JWT_SECRET: z.string(), // We will add defaults later if testing

  // Spotify OAuth
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_CALLBACK_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  
  if (!result.success) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }
  
  return result.data;
}
