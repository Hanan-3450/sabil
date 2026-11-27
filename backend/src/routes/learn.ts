import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createDownloadUrl } from "../lib/s3.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const updateTrackSchema = z.object({
  status: z.enum(["NOT_FINISHED", "FINISHED"]).optional(),
  lastPositionSec: z.number().int().min(0).optional(),
});

const bookmarkSchema = z.object({
  pageNumber: z.number().int().min(1),
  label: z.string().trim().max(120).optional().nullable(),
});

// GET /api/learn/kitabs/:id
// Returns Kitab details, signed PDF URL, signed Audio Track URLs, bookmark, and notes
router.get("/kitabs/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);

  try {
    const kitab = await prisma.kitab.findFirst({
      where: { id, userId: req.userId },
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
        notes: {
          orderBy: [{ dersNumber: "asc" }, { createdAt: "asc" }],
          include: {
            category: { select: { id: true, name: true } },
            kitab: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!kitab) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const pdfUrl = kitab.pdfKey
      ? await createDownloadUrl(kitab.pdfKey, 7200)
      : null;

    const audioTracks = await Promise.all(
      kitab.audioTracks.map(async (track) => ({
        ...track,
        audioUrl: await createDownloadUrl(track.audioKey, 7200),
      }))
    );

    res.json({
      kitab: {
        id: kitab.id,
        title: kitab.title,
        author: kitab.author,
        description: kitab.description,
        categoryId: kitab.categoryId,
        category: kitab.category,
        pdfFileName: kitab.pdfFileName,
        pdfUrl,
        bookmark: kitab.bookmarks[0] || null,
        audioTracks,
        notes: kitab.notes,
      },
    });
  } catch (err) {
    console.error("Load learn kitab error:", err);
    res.status(500).json({ error: "Failed to load learning workspace" });
  }
});

// PATCH /api/learn/tracks/:trackId
// Update Finished/Not Finished status and/or playback position
router.patch("/tracks/:trackId", async (req: AuthRequest, res) => {
  const trackId = String(req.params.trackId);
  const parsed = updateTrackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const existing = await prisma.audioTrack.findFirst({
      where: { id: trackId, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Audio track not found" });
      return;
    }

    const track = await prisma.audioTrack.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    res.json({ track });
  } catch (err) {
    console.error("Update track progress error:", err);
    res.status(500).json({ error: "Failed to update track status" });
  }
});

// PUT /api/learn/kitabs/:id/bookmark
// Save or update the student's PDF identifying sign (page + optional note)
router.put("/kitabs/:id/bookmark", async (req: AuthRequest, res) => {
  const kitabId = String(req.params.id);
  const parsed = bookmarkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const kitab = await prisma.kitab.findFirst({
      where: { id: kitabId, userId: req.userId },
    });
    if (!kitab) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const bookmark = await prisma.pdfBookmark.upsert({
      where: {
        userId_kitabId: {
          userId: req.userId!,
          kitabId: kitab.id,
        },
      },
      update: {
        pageNumber: parsed.data.pageNumber,
        label: parsed.data.label ?? null,
      },
      create: {
        userId: req.userId!,
        kitabId: kitab.id,
        pageNumber: parsed.data.pageNumber,
        label: parsed.data.label ?? null,
      },
    });

    res.json({ bookmark });
  } catch (err) {
    console.error("Save bookmark error:", err);
    res.status(500).json({ error: "Failed to save PDF bookmark" });
  }
});

export default router;