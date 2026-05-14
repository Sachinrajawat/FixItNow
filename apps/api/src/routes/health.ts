import { Router } from "express";
import mongoose from "mongoose";
import { getRedis } from "../config/redis";

const router = Router();

/**
 * Liveness — is the process up at all?
 */
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/**
 * Readiness — are upstream dependencies (DB, cache) reachable?
 * Returns 503 if any check fails so Kubernetes / load balancers route traffic
 * away from the instance.
 */
router.get("/readyz", async (_req, res) => {
  const checks: Record<string, "up" | "down"> = {};

  checks.mongo = mongoose.connection.readyState === 1 ? "up" : "down";

  try {
    const pong = await getRedis().ping();
    checks.redis = pong === "PONG" ? "up" : "down";
  } catch {
    checks.redis = "down";
  }

  const ready = Object.values(checks).every((s) => s === "up");
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    checks,
  });
});

export default router;
