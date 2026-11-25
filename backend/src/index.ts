import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { prisma, disconnectPrisma } from "./lib/prisma.js";
import { ensureBucketExists } from "./lib/s3.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_URL.split(",").map((u) => u.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", authRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "sabil-api",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Healthcheck DB error:", err);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

const server = app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Sabil API listening on http://0.0.0.0:${PORT}`);
  try {
    await ensureBucketExists();
  } catch (err) {
    console.warn("S3 bucket check skipped/failed:", err);
  }
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));