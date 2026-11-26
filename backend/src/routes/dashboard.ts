import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard
router.get("/", async (req: AuthRequest, res) => {
  try {
    const [categories, kitabs, notes] = await Promise.all([
      prisma.category.findMany({
        where: { userId: req.userId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          kitabs: {
            include: {
              audioTracks: { select: { status: true } },
            },
          },
          _count: { select: { notes: true } },
        },
      }),
      prisma.kitab.findMany({
        where: { userId: req.userId },
        orderBy: { updatedAt: "desc" },
        include: {
          category: { select: { id: true, name: true, arabicName: true } },
          audioTracks: { select: { status: true } },
          bookmarks: {
            where: { userId: req.userId },
            take: 1,
          },
          _count: { select: { notes: true } },
        },
      }),
      prisma.note.findMany({
        where: { userId: req.userId },
        orderBy: { updatedAt: "desc" },
        take: 30,
        include: {
          category: { select: { id: true, name: true, arabicName: true } },
          kitab: { select: { id: true, title: true } },
        },
      }),
    ]);

    let totalTracks = 0;
    let finishedTracks = 0;

    const categoryCards = categories.map((cat) => {
      let catTracks = 0;
      let catFinished = 0;

      for (const k of cat.kitabs) {
        catTracks += k.audioTracks.length;
        catFinished += k.audioTracks.filter(
          (t) => t.status === "FINISHED"
        ).length;
      }

      return {
        id: cat.id,
        name: cat.name,
        arabicName: cat.arabicName,
        description: cat.description,
        kitabCount: cat.kitabs.length,
        totalTracks: catTracks,
        finishedTracks: catFinished,
        notesCount: cat._count.notes,
      };
    });

    const kitabProgress = kitabs.map((k) => {
      const kTotal = k.audioTracks.length;
      const kFinished = k.audioTracks.filter(
        (t) => t.status === "FINISHED"
      ).length;

      totalTracks += kTotal;
      finishedTracks += kFinished;

      return {
        id: k.id,
        title: k.title,
        author: k.author,
        categoryId: k.categoryId,
        categoryName: k.category.name,
        hasPdf: Boolean(k.pdfKey),
        totalTracks: kTotal,
        finishedTracks: kFinished,
        notesCount: k._count.notes,
        bookmarkPage: k.bookmarks[0]?.pageNumber ?? null,
        bookmarkLabel: k.bookmarks[0]?.label ?? null,
      };
    });

    const completionPercent =
      totalTracks > 0 ? Math.round((finishedTracks / totalTracks) * 100) : 0;

    res.json({
      stats: {
        totalCategories: categories.length,
        totalKitabs: kitabs.length,
        totalTracks,
        finishedTracks,
        completionPercent,
        totalNotes: notes.length,
      },
      categories: categoryCards,
      kitabProgress,
      notes,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;