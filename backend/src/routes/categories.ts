import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { deleteS3Object } from "../lib/s3.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is too short").max(60),
  arabicName: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().default(""),
});

// GET /api/categories
router.get("/", async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { kitabs: true, notes: true } },
      },
    });
    res.json({ categories });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

// POST /api/categories
router.post("/", async (req: AuthRequest, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, arabicName, description } = parsed.data;

  try {
    const existing = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }

    const count = await prisma.category.count({ where: { userId: req.userId } });

    const category = await prisma.category.create({
      data: {
        userId: req.userId!,
        name,
        arabicName: arabicName || null,
        description,
        isDefault: false,
        sortOrder: count + 1,
      },
      include: {
        _count: { select: { kitabs: true, notes: true } },
      },
    });

    res.status(201).json({ category });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PATCH /api/categories/:id
router.patch("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, arabicName, description } = parsed.data;

  try {
    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const duplicate = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        id: { not: id },
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (duplicate) {
      res.status(409).json({ error: "Another category already uses this name" });
      return;
    }

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: {
        name,
        arabicName: arabicName || null,
        description,
      },
      include: {
        _count: { select: { kitabs: true, notes: true } },
      },
    });

    res.json({ category });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});


// DELETE /api/categories/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  const id = String(req.params.id);

  try {
    const category = await prisma.category.findFirst({
      where: { id, userId: req.userId },
      include: {
        kitabs: {
          include: { audioTracks: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    // Collect all S3 keys under this category to clean up
    const keysToDelete: string[] = [];
    for (const kitab of category.kitabs) {
      if (kitab.pdfKey) keysToDelete.push(kitab.pdfKey);
      for (const track of kitab.audioTracks) {
        keysToDelete.push(track.audioKey);
      }
    }

    await prisma.category.delete({ where: { id: category.id } });
    await Promise.allSettled(keysToDelete.map((k) => deleteS3Object(k)));

    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;