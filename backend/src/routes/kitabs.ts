import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { deleteS3Object } from "../lib/s3.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const createKitabSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(2, "Kitab title is required").max(140),
  author: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().default(""),
});

const attachPdfSchema = z.object({
  pdfKey: z.string().min(1),
  pdfFileName: z.string().min(1).max(200),
  pdfSizeBytes: z.number().int().positive(),
});

const addTrackSchema = z.object({
  title: z.string().trim().min(1).max(150),
  trackNumber: z.number().int().positive(),
  audioKey: z.string().min(1),
  audioFileName: z.string().min(1).max(200),
  audioSizeBytes: z.number().int().positive(),
});

// GET /api/kitabs?categoryId=...
router.get("/", async (req: AuthRequest, res) => {
  const categoryId = req.query.categoryId
    ? String(req.query.categoryId)
    : undefined;

  try {
    const kitabs = await prisma.kitab.findMany({
      where: {
        userId: req.userId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { id: true, name: true, arabicName: true },
        },
        audioTracks: {
          orderBy: { trackNumber: "asc" },
        },
        bookmarks: {
          where: { userId: req.userId },
          take: 1,
        },
        _count: {
          select: { notes: true },
        },
      },
    });

    res.json({ kitabs });
  } catch (err) {
    console.error("Get kitabs error:", err);
    res.status(500).json({ error: "Failed to load kitabs" });
  }
});

// POST /api/kitabs
router.post("/", async (req: AuthRequest, res) => {
  const parsed = createKitabSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { categoryId, title, author, description } = parsed.data;

  try {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.userId },
    });

    if (!category) {
      res.status(404).json({ error: "Selected category not found" });
      return;
    }

    const kitab = await prisma.kitab.create({
      data: {
        userId: req.userId!,
        categoryId,
        title,
        author: author || null,
        description,
      },
      include: {
        category: { select: { id: true, name: true, arabicName: true } },
        audioTracks: true,
        bookmarks: true,
        _count: { select: { notes: true } },
      },
    });

    res.status(201).json({ kitab });
  } catch (err) {
    console.error("Create kitab error:", err);
    res.status(500).json({ error: "Failed to create kitab" });
  }
});

// PATCH /api/kitabs/:id
router.patch("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const parsed = createKitabSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { categoryId, title, author, description } = parsed.data;

  try {
    const existing = await prisma.kitab.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.userId },
    });
    if (!category) {
      res.status(404).json({ error: "Selected category not found" });
      return;
    }

    const kitab = await prisma.kitab.update({
      where: { id: existing.id },
      data: {
        categoryId,
        title,
        author: author || null,
        description,
      },
      include: {
        category: { select: { id: true, name: true, arabicName: true } },
        audioTracks: { orderBy: { trackNumber: "asc" } },
        bookmarks: { where: { userId: req.userId }, take: 1 },
        _count: { select: { notes: true } },
      },
    });

    res.json({ kitab });
  } catch (err) {
    console.error("Update kitab error:", err);
    res.status(500).json({ error: "Failed to update kitab" });
  }
});

// PATCH /api/kitabs/:id/pdf
router.patch("/:id/pdf", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const parsed = attachPdfSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { pdfKey, pdfFileName, pdfSizeBytes } = parsed.data;
  if (!pdfKey.startsWith(`users/${req.userId}/`)) {
    res.status(403).json({ error: "Invalid file ownership" });
    return;
  }

  try {
    const existing = await prisma.kitab.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const oldKey = existing.pdfKey;

    const kitab = await prisma.kitab.update({
      where: { id: existing.id },
      data: { pdfKey, pdfFileName, pdfSizeBytes },
      include: {
        category: { select: { id: true, name: true, arabicName: true } },
        audioTracks: { orderBy: { trackNumber: "asc" } },
        bookmarks: true,
        _count: { select: { notes: true } },
      },
    });

    if (oldKey && oldKey !== pdfKey) {
      deleteS3Object(oldKey).catch(() => {});
    }

    res.json({ kitab });
  } catch (err) {
    console.error("Attach PDF error:", err);
    res.status(500).json({ error: "Failed to save PDF metadata" });
  }
});

// POST /api/kitabs/:id/tracks
router.post("/:id/tracks", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const parsed = addTrackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { title, trackNumber, audioKey, audioFileName, audioSizeBytes } =
    parsed.data;

  if (!audioKey.startsWith(`users/${req.userId}/`)) {
    res.status(403).json({ error: "Invalid file ownership" });
    return;
  }

  try {
    const kitab = await prisma.kitab.findFirst({
      where: { id, userId: req.userId },
    });

    if (!kitab) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const track = await prisma.audioTrack.create({
      data: {
        userId: req.userId!,
        kitabId: kitab.id,
        title,
        trackNumber,
        audioKey,
        audioFileName,
        audioSizeBytes,
      },
    });

    res.status(201).json({ track });
  } catch (err) {
    console.error("Add track error:", err);
    res.status(500).json({ error: "Failed to save audio track" });
  }
});

// DELETE /api/kitabs/:id/tracks/:trackId
router.delete("/:id/tracks/:trackId", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const trackId = String(req.params.trackId);

  try {
    const track = await prisma.audioTrack.findFirst({
      where: { id: trackId, kitabId: id, userId: req.userId },
    });

    if (!track) {
      res.status(404).json({ error: "Audio track not found" });
      return;
    }

    await prisma.audioTrack.delete({ where: { id: track.id } });
    deleteS3Object(track.audioKey).catch(() => {});

    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete track error:", err);
    res.status(500).json({ error: "Failed to delete audio track" });
  }
});

// DELETE /api/kitabs/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);

  try {
    const kitab = await prisma.kitab.findFirst({
      where: { id, userId: req.userId },
      include: { audioTracks: true },
    });

    if (!kitab) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const keysToDelete: string[] = [];
    if (kitab.pdfKey) keysToDelete.push(kitab.pdfKey);
    for (const track of kitab.audioTracks) {
      keysToDelete.push(track.audioKey);
    }

    await prisma.kitab.delete({ where: { id: kitab.id } });
    await Promise.allSettled(keysToDelete.map((k) => deleteS3Object(k)));

    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete kitab error:", err);
    res.status(500).json({ error: "Failed to delete kitab" });
  }
});

export default router;