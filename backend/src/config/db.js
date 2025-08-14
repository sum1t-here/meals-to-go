import { drizzle } from "drizzle-orm/singlestore/driver";
import { neon } from "@neondatabase/serverless";
import { ENV } from "./env";
import * as schema from "../db/schema.js"

const sql = neon(ENV.DB_URI);
export const db = drizzle(sql, { schema });