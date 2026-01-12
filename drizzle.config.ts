import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",  // must be "sqlite" for local dev.db
  dbCredentials: {
    url: "file:./dev.db",
  },
});