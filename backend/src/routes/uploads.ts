import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createUploadUrl } from "../lib/s3.js";

const router = Router();
router.use(requireAuth);

const MAX_PDF_BYTES = 80 * 1024 * 1024; // 80 MB
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200 MB

const presignSchema = z.object({
  kind: z.enum(["pdf", "audio"]),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(120),
  fileSizeBytes: z.number().int().positive(),
});

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

// POST /api/uploads/presign
router.post("/presign", async (req: AuthRequest, res) => {
  const parsed = presignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { kind, fileName, contentType, fileSizeBytes } = parsed.data;

  if (kind === "pdf") {
    if (contentType !== "application/pdf") {
      res.status(400).json({ error: "Only PDF files are allowed for Kitab books" });
      return;
    }
    if (fileSizeBytes > MAX_PDF_BYTES) {
      res.status(400).json({ error: "PDF file must be 80 MB or smaller" });
      return;
    }
  } else {
    if (!contentType.startsWith("audio/")) {
      res.status(400).json({ error: "Only audio files are allowed for tracks" });
      return;
    }
    if (fileSizeBytes > MAX_AUDIO_BYTES) {
      res.status(400).json({ error: "Audio track must be 200 MB or smaller" });
      return;
    }
  }

  try {
    const safeName = sanitizeFileName(fileName);
    const key = `users/${req.userId}/${kind}/${crypto.randomUUID()}-${safeName}`;
    const uploadUrl = await createUploadUrl(key, contentType);

    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("Presign error:", err);
    res.status(500).json({ error: "Could not prepare file upload" });
  }
});

export default router;