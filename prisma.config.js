// prisma.config.js
import "dotenv/config"; // <-- This MUST be the very first line
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // If dotenv didn't load the .env file, this line throws the exact error you are seeing
    url: env("DATABASE_URL"), 
  },
});
