import { Pool } from "pg";
import { DATABASE_URL } from "./env.js";

export const db = new Pool({
  connectionString: DATABASE_URL,
});
