import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const createNoteSchema = z.object({
  kitabId: z.string().uuid(),
  dersTitle: z.string().trim().min(1, "Ders title is required").max(120),
  dersNumber: z.number().int().positive().nullable().optional(),
  content: z.string().trim().min(1, "Note content cannot be empty").max(20000),
});

const updateNoteSchema = z.object({
  dersTitle: z.string().trim().min(1).max(120).optional(),
  dersNumber: z.number().int().positive().nullable().optional(),
  content: z.string().trim().min(1).max(20000).optional(),
});

// GET /api/notes?categoryId=...&kitabId=...
router.get("/", async (req: AuthRequest, res) => {
  const categoryId = req.query.categoryId
    ? String(req.query.categoryId)
    : undefined;
  const kitabId = req.query.kitabId ? String(req.query.kitabId) : undefined;

  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: req.userId,
        ...(categoryId ? { categoryId } : {}),
        ...(kitabId ? { kitabId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        category: { select: { id: true, name: true, arabicName: true } },
        kitab: { select: { id: true, title: true } },
      },
    });

    res.json({ notes });
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ error: "Failed to load notes" });
  }
});

// POST /api/notes
router.post("/", async (req: AuthRequest, res) => {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { kitabId, dersTitle, dersNumber, content } = parsed.data;

  try {
    const kitab = await prisma.kitab.findFirst({
      where: { id: kitabId, userId: req.userId },
    });
    if (!kitab) {
      res.status(404).json({ error: "Kitab not found" });
      return;
    }

    const note = await prisma.note.create({
      data: {
        userId: req.userId!,
        categoryId: kitab.categoryId,
        kitabId: kitab.id,
        dersTitle,
        dersNumber: dersNumber ?? null,
        content,
      },
      include: {
        category: { select: { id: true, name: true, arabicName: true } },
        kitab: { select: { id: true, title: true } },
      },
    });

    res.status(201).json({ note });
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// PATCH /api/notes/:id
router.patch("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const parsed = updateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const existing = await prisma.note.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const note = await prisma.note.update({
      where: { id: existing.id },
      data: parsed.data,
      include: {
        category: { select: { id: true, name: true, arabicName: true } },
        kitab: { select: { id: true, title: true } },
      },
    });

    res.json({ note });
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);

  try {
    const existing = await prisma.note.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    await prisma.note.delete({ where: { id: existing.id } });
    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;