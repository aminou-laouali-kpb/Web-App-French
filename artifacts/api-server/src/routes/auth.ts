import { Router, type IRouter } from "express";
import crypto from "crypto";
import { VerifyPasswordBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export function generateSessionToken(secret: string): string {
  const payload = JSON.stringify({ iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string, secret: string): boolean {
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx === -1) return false;
  const b64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!b64 || !sig) return false;

  const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

router.post("/auth/verify", async (req, res): Promise<void> => {
  const parsed = VerifyPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!dashboardPassword || !sessionSecret) {
    logger.error("DASHBOARD_PASSWORD or SESSION_SECRET environment variable is not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (parsed.data.password !== dashboardPassword) {
    res.status(401).json({ error: "Mot de passe incorrect" });
    return;
  }

  const token = generateSessionToken(sessionSecret);
  res.json({ success: true, token });
});

export default router;
