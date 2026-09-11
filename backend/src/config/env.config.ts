import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure .env is loaded
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL environment variable is required'
  }).min(1, 'DATABASE_URL cannot be empty'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET environment variable is required'
  }).min(8, 'JWT_SECRET must be at least 8 characters long'),
  FRONTEND_URL: z.string().default('http://localhost:3000')
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ [ENVIRONMENT CONFIGURATION ERROR] Invalid or missing environment variables:');
    result.error.errors.forEach(err => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });

    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Falling back to test environment defaults...');
      return envSchema.parse({
        PORT: '5000',
        NODE_ENV: 'test',
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/test_db',
        JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key-32-chars-long',
        FRONTEND_URL: 'http://localhost:3000'
      });
    }

    console.error('💥 Exiting backend process due to configuration failure.');
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
