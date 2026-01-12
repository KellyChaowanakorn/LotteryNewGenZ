import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";

const client = createClient({
  url: "file:./dev.db",  // Local file – fast and no internet needed
});

export const db = drizzle(client, { schema });