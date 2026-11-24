import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Required behind EthioDeploy / reverse proxies for HTTPS & cookies
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

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sabil-api",
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sabil API listening on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown for EthioDeploy sleep/redeploys
const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));