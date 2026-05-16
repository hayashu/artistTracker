import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  ticketmasterApiKey: requireEnv("TICKETMASTER_API_KEY"),
  allowedOrigins: (process.env.ALLOWED_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  token: process.env.IPINFO_TOKEN,
  sessionSecret: requireEnv("SESSION_SECRET")
} as const;
