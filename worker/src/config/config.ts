import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// .env lives at the repo root, two levels up from src/ (and from dist/).
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../.env"), quiet: true });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set — check .env at the repo root`);
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export const NASA_KEY = required("NASA_KEY");
export const REDIS_HOST = optional("REDIS_HOST", "127.0.0.1");
export const REDIS_PORT = Number(optional("REDIS_PORT", "6379"));
export const DATABASE_URL = optional("DATABASE_URL","postgres://postgres:postgres@localhost:5432/asteroid_tracker");
export const KAFKA_BROKER = optional("KAFKA_BROKER", "localhost:9092");
