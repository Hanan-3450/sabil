import { useEffect, useState, type FormEvent } from "react";
import {
  BookPlus,
  CheckCircle2,
  FileText,
  FolderPlus,
  Music,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import { presignAndUpload } from "../lib/upload";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "../components/ThemeToggle";

interface Category {
  id: string;
  name: string;
  arabicName: string | null;
  description: string;
  isDefault: boolean;
  _count: { kitabs: number; notes: number };
}

interface AudioTrack {
  id: string;
  title: string;
  trackNumber: number;
  audioFileName: string;
  audioSizeBytes: number | null;
  status: "NOT_FINISHED" | "FINISHED";
}

interface Kitab {
  id: string;
  categoryId: string;
  title: string;
  author: string | null;
  description: string;
  pdfKey: string | null;
  pdfFileName: string | null;
  pdfSizeBytes: number | null;
  category: { id: string; name: string; arabicName: string | null };
  audioTracks: AudioTrack[];
  _count: { notes: number };
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanTrackTitle(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"kitabs" | "categories" | "account">("kitabs");
  const [categories, setCategories] = useState<Category[]>([]);
  const [kitabs, setKitabs] = useState<Kitab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // New Category form
  const [catName, setCatName] = useState("");
  const [catArabic, setCatArabic] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // New Kitab form
  const [kitabCatId, setKitabCatId] = useState("");
  const [kitabTitle, setKitabTitle] = useState("");
  const [kitabAuthor, setKitabAuthor] = useState("");
  const [kitabDesc, setKitabDesc] = useState("");
  const [creatingKitab, setCreatingKitab] = useState(false);

  // Upload states
  const [pdfProgress, setPdfProgress] = useState<Record<string, number>>({});
  const [audioUploadState, setAudioUploadState] = useState<{
    kitabId: string;
    currentFile: string;
    index: number;
    total: number;
    percent: number;
  } | null>(null);

  // Inline edit state for Categories
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatArabic, setEditCatArabic] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");

  // Inline edit state for Kitabs
  const [editingKitabId, setEditingKitabId] = useState<string | null>(null);
  const [editKitabCatId, setEditKitabCatId] = useState("");
  const [editKitabTitle, setEditKitabTitle] = useState("");
  const [editKitabAuthor, setEditKitabAuthor] = useState("");
  const [editKitabDesc, setEditKitabDesc] = useState("");

  const loadData = async () => {
    try {
      const [catRes, kitabRes] = await Promise.all([
        apiFetch<{ categories: Category[] }>("/api/categories"),
        apiFetch<{ kitabs: Kitab[] }>("/api/kitabs"),
      ]);
      setCategories(catRes.categories);
      setKitabs(kitabRes.kitabs);
      if (!kitabCatId && catRes.categories.length > 0) {
        setKitabCatId(catRes.categories[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreatingCat(true);
    try {
      const { category } = await apiFetch<{ category: Category }>(
        "/api/categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: catName,
            arabicName: catArabic,
            description: catDesc,
          }),
        }
      );
      setCategories((prev) => [...prev, category]);
      if (!kitabCatId) setKitabCatId(category.id);
      setCatName("");
      setCatArabic("");
      setCatDesc("");
      setNotice(`Category "${category.name}" created.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add category");
    } finally {
      setCreatingCat(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatArabic(cat.arabicName || "");
    setEditCatDesc(cat.description || "");
  };

  const handleSaveCategory = async (e: FormEvent, id: string) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const { category } = await apiFetch<{ category: Category }>(
        `/api/categories/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editCatName,
            arabicName: editCatArabic,
            description: editCatDesc,
          }),
        }
      );
      setCategories((prev) => prev.map((c) => (c.id === id ? category : c)));
      setKitabs((prev) =>
        prev.map((k) =>
          k.categoryId === id
            ? {
                ...k,
                category: {
                  id: category.id,
                  name: category.name,
                  arabicName: category.arabicName,
                },
              }
            : k
        )
      );
      setEditingCatId(null);
      setNotice(`Updated category "${category.name}".`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update category"
      );
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (
      !window.confirm(
        `Delete "${cat.name}" and all ${cat._count.kitabs} Kitab(s) inside it?`
      )
    ) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await apiFetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const remaining = categories.filter((c) => c.id !== cat.id);
      setCategories(remaining);
      setKitabs((prev) => prev.filter((k) => k.categoryId !== cat.id));
      if (kitabCatId === cat.id) {
        setKitabCatId(remaining[0]?.id || "");
      }
      setNotice(`Deleted category "${cat.name}".`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete category"
      );
    }
  };

  const handleCreateKitab = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setCreatingKitab(true);
    try {
      const { kitab } = await apiFetch<{ kitab: Kitab }>("/api/kitabs", {
        method: "POST",
        body: JSON.stringify({
          categoryId: kitabCatId,
          title: kitabTitle,
          author: kitabAuthor,
          description: kitabDesc,
        }),
      });
      setKitabs((prev) => [kitab, ...prev]);
      setKitabTitle("");
      setKitabAuthor("");
      setKitabDesc("");
      setNotice(`Kitab "${kitab.title}" added.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create kitab");
    } finally {
      setCreatingKitab(false);
    }
  };

  const startEditKitab = (kitab: Kitab) => {
    setEditingKitabId(kitab.id);
    setEditKitabCatId(kitab.categoryId);
    setEditKitabTitle(kitab.title);
    setEditKitabAuthor(kitab.author || "");
    setEditKitabDesc(kitab.description || "");
  };

  const handleSaveKitab = async (e: FormEvent, id: string) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const { kitab } = await apiFetch<{ kitab: Kitab }>(`/api/kitabs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: editKitabCatId,
          title: editKitabTitle,
          author: editKitabAuthor,
          description: editKitabDesc,
        }),
      });
      setKitabs((prev) => prev.map((k) => (k.id === id ? kitab : k)));
      setEditingKitabId(null);
      setNotice(`Updated Kitab "${kitab.title}".`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update kitab");
    }
  };

  const handlePdfUpload = async (kitabId: string, file: File) => {
    setError("");
    setNotice("");
    try {
      setPdfProgress((p) => ({ ...p, [kitabId]: 1 }));
      const { key } = await presignAndUpload("pdf", file, (pct) => {
        setPdfProgress((p) => ({ ...p, [kitabId]: pct }));
      });

      const { kitab } = await apiFetch<{ kitab: Kitab }>(
        `/api/kitabs/${kitabId}/pdf`,
        {
          method: "PATCH",
          body: JSON.stringify({
            pdfKey: key,
            pdfFileName: file.name,
            pdfSizeBytes: file.size,
          }),
        }
      );

      setKitabs((prev) => prev.map((k) => (k.id === kitabId ? kitab : k)));
      setNotice(`Uploaded PDF "${file.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF upload failed");
    } finally {
      setPdfProgress((p) => {
        const copy = { ...p };
        delete copy[kitabId];
        return copy;
      });
    }
  };

  const handleAudioUploads = async (kitab: Kitab, fileList: FileList) => {
    const files = Array.from(fileList).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    if (files.length === 0) return;

    setError("");
    setNotice("");

    let nextNumber =
      kitab.audioTracks.length > 0
        ? Math.max(...kitab.audioTracks.map((t) => t.trackNumber)) + 1
        : 1;

    try {
      const addedTracks: AudioTrack[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAudioUploadState({
          kitabId: kitab.id,
          currentFile: file.name,
          index: i + 1,
          total: files.length,
          percent: 0,
        });

        const { key } = await presignAndUpload("audio", file, (pct) => {
          setAudioUploadState((prev) =>
            prev ? { ...prev, percent: pct } : null
          );
        });

        const { track } = await apiFetch<{ track: AudioTrack }>(
          `/api/kitabs/${kitab.id}/tracks`,
          {
            method: "POST",
            body: JSON.stringify({
              title: cleanTrackTitle(file.name),
              trackNumber: nextNumber++,
              audioKey: key,
              audioFileName: file.name,
              audioSizeBytes: file.size,
            }),
          }
        );

        addedTracks.push(track);
      }

      setKitabs((prev) =>
        prev.map((k) =>
          k.id === kitab.id
            ? { ...k, audioTracks: [...k.audioTracks, ...addedTracks] }
            : k
        )
      );
      setNotice(
        `Uploaded ${addedTracks.length} track(s) to "${kitab.title}".`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio upload failed");
    } finally {
      setAudioUploadState(null);
    }
  };

  const handleDeleteTrack = async (kitabId: string, trackId: string) => {
    try {
      await apiFetch(`/api/kitabs/${kitabId}/tracks/${trackId}`, {
        method: "DELETE",
      });
      setKitabs((prev) =>
        prev.map((k) =>
          k.id === kitabId
            ? {
                ...k,
                audioTracks: k.audioTracks.filter((t) => t.id !== trackId),
              }
            : k
        )
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to remove track"
      );
    }
  };

  const handleDeleteKitab = async (kitab: Kitab) => {
    if (
      !window.confirm(
        `Delete Kitab "${kitab.title}" and all its files and notes?`
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/api/kitabs/${kitab.id}`, { method: "DELETE" });
      setKitabs((prev) => prev.filter((k) => k.id !== kitab.id));
      setNotice(`Deleted Kitab "${kitab.title}".`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete kitab");
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-[#57534E] dark:text-[#9CA3AF]">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings & Library</h1>
        <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] mt-1">
          Manage categories, create Kitabs, and upload PDFs & audio tracks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E7E5E4] dark:border-[#2A2E35] pb-3">
        {[
          { id: "kitabs", label: `Kitabs (${kitabs.length})` },
          { id: "categories", label: `Categories (${categories.length})` },
          { id: "account", label: "Account" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-[#0227a1] text-white"
                : "bg-white dark:bg-[#1A1D21] border border-[#E7E5E4] dark:border-[#2A2E35] text-[#57534E] dark:text-[#9CA3AF] hover:text-[#1C1917] dark:hover:text-[#ECEAE4]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-lg border border-[#0227a1]/20 dark:border-[#7C9BFF]/30 bg-[#0227a1]/8 dark:bg-[#0227a1]/25 text-xs text-[#0227a1] dark:text-[#7C9BFF] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* TAB 1: KITABS & UPLOADS */}
      {tab === "kitabs" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateKitab}
            className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <BookPlus className="w-4 h-4 text-[#0227a1] dark:text-[#7C9BFF]" />
              <h2 className="font-semibold text-sm">Add New Kitab</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Category
                </label>
                <select
                  required
                  value={kitabCatId}
                  onChange={(e) => setKitabCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.arabicName ? `(${c.arabicName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Kitab Title
                </label>
                <input
                  type="text"
                  required
                  value={kitabTitle}
                  onChange={(e) => setKitabTitle(e.target.value)}
                  placeholder="Riyad al-Salihin"
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Author (optional)
                </label>
                <input
                  type="text"
                  value={kitabAuthor}
                  onChange={(e) => setKitabAuthor(e.target.value)}
                  placeholder="Imam al-Nawawi"
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={kitabDesc}
                  onChange={(e) => setKitabDesc(e.target.value)}
                  placeholder="Short note"
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={creatingKitab || categories.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] disabled:opacity-60 text-white text-sm font-medium cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingKitab ? "Creating..." : "Create Kitab"}</span>
              </button>
            </div>
          </form>

          {kitabs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-8 text-center text-xs text-[#57534E] dark:text-[#9CA3AF]">
              No Kitabs yet. Create one above to upload its PDF and audio tracks.
            </div>
          ) : (
            <div className="space-y-4">
              {kitabs.map((kitab) => {
                const pdfPct = pdfProgress[kitab.id];
                const uploadingAudioHere =
                  audioUploadState?.kitabId === kitab.id;

                return (
                  <div
                    key={kitab.id}
                    className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-4"
                  >
                    {editingKitabId === kitab.id ? (
                      <form
                        onSubmit={(e) => handleSaveKitab(e, kitab.id)}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <select
                            required
                            value={editKitabCatId}
                            onChange={(e) => setEditKitabCatId(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            value={editKitabTitle}
                            onChange={(e) => setEditKitabTitle(e.target.value)}
                            placeholder="Kitab title"
                            className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                          />
                          <input
                            type="text"
                            value={editKitabAuthor}
                            onChange={(e) => setEditKitabAuthor(e.target.value)}
                            placeholder="Author"
                            className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          value={editKitabDesc}
                          onChange={(e) => setEditKitabDesc(e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium cursor-pointer"
                          >
                            Save changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKitabId(null)}
                            className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#0227a1]/8 dark:bg-[#0227a1]/30 text-[#0227a1] dark:text-[#7C9BFF] border border-[#0227a1]/15 dark:border-[#7C9BFF]/25">
                            {kitab.category.name}
                          </span>
                          <h3 className="text-lg font-semibold mt-1.5">
                            {kitab.title}
                          </h3>
                          {kitab.author && (
                            <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                              By {kitab.author}
                            </p>
                          )}
                          {kitab.description && (
                            <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] mt-1">
                              {kitab.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEditKitab(kitab)}
                            className="p-2 rounded-lg text-[#57534E] dark:text-[#9CA3AF] hover:text-[#0227a1] dark:hover:text-[#7C9BFF] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] cursor-pointer"
                            title="Edit Kitab"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteKitab(kitab)}
                            className="p-2 rounded-lg text-[#57534E] dark:text-[#9CA3AF] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#FAF8F5] dark:hover:bg-[#121417] cursor-pointer"
                            title="Delete Kitab"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* PDF & Audio Upload Boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E7E5E4] dark:border-[#2A2E35]">
                      <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <FileText className="w-4 h-4 text-[#0227a1] dark:text-[#7C9BFF]" />
                            <span>Kitab PDF</span>
                          </div>
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#1A1D21] border border-[#E7E5E4] dark:border-[#2A2E35] text-xs font-medium hover:border-[#0227a1] cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{kitab.pdfKey ? "Replace" : "Upload PDF"}</span>
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handlePdfUpload(kitab.id, f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {pdfPct !== undefined ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[#57534E] dark:text-[#9CA3AF]">
                              <span>Uploading...</span>
                              <span>{pdfPct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#E7E5E4] dark:bg-[#2A2E35] overflow-hidden">
                              <div
                                className="h-full bg-[#0227a1] dark:bg-[#7C9BFF] transition-all"
                                style={{ width: `${pdfPct}%` }}
                              />
                            </div>
                          </div>
                        ) : kitab.pdfFileName ? (
                          <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] truncate">
                            {kitab.pdfFileName} ({formatBytes(kitab.pdfSizeBytes)})
                          </p>
                        ) : (
                          <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                            No PDF uploaded
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Music className="w-4 h-4 text-[#0227a1] dark:text-[#7C9BFF]" />
                            <span>Audio ({kitab.audioTracks.length})</span>
                          </div>
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#1A1D21] border border-[#E7E5E4] dark:border-[#2A2E35] text-xs font-medium hover:border-[#0227a1] cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Add Audio</span>
                            <input
                              type="file"
                              accept="audio/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleAudioUploads(kitab, e.target.files);
                                }
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {uploadingAudioHere && audioUploadState ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[#57534E] dark:text-[#9CA3AF]">
                              <span className="truncate pr-2">
                                ({audioUploadState.index}/{audioUploadState.total}){" "}
                                {audioUploadState.currentFile}
                              </span>
                              <span>{audioUploadState.percent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#E7E5E4] dark:bg-[#2A2E35] overflow-hidden">
                              <div
                                className="h-full bg-[#0227a1] dark:bg-[#7C9BFF] transition-all"
                                style={{ width: `${audioUploadState.percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                            Select one or multiple files
                          </p>
                        )}
                      </div>
                    </div>

                    {kitab.audioTracks.length > 0 && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {kitab.audioTracks.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121417] text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-[#0227a1] dark:text-[#7C9BFF] shrink-0">
                                #{track.trackNumber}
                              </span>
                              <span className="truncate">{track.title}</span>
                              <span className="text-[#57534E] dark:text-[#9CA3AF] shrink-0">
                                ({formatBytes(track.audioSizeBytes)})
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteTrack(kitab.id, track.id)}
                              className="p-1 text-[#57534E] hover:text-red-600 cursor-pointer shrink-0"
                              title="Remove track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DERS CATEGORIES */}
      {tab === "categories" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateCategory}
            className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#0227a1] dark:text-[#7C9BFF]" />
              <h2 className="font-semibold text-sm">New Category</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Tafsir, Nahw, Usul al-Fiqh"
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Arabic Name (optional)
                </label>
                <input
                  type="text"
                  value={catArabic}
                  onChange={(e) => setCatArabic(e.target.value)}
                  placeholder="التفسير"
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Short description"
                  className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={creatingCat}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] disabled:opacity-60 text-white text-sm font-medium cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingCat ? "Adding..." : "Add Category"}</span>
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4"
              >
                {editingCatId === cat.id ? (
                  <form
                    onSubmit={(e) => handleSaveCategory(e, cat.id)}
                    className="space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        placeholder="Category name"
                        className="px-2.5 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                      />
                      <input
                        type="text"
                        value={editCatArabic}
                        onChange={(e) => setEditCatArabic(e.target.value)}
                        placeholder="Arabic name"
                        className="px-2.5 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={editCatDesc}
                      onChange={(e) => setEditCatDesc(e.target.value)}
                      placeholder="Description"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="px-3 py-1 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-semibold text-sm">{cat.name}</h3>
                        {cat.arabicName && (
                          <span className="font-arabic text-base text-[#0227a1] dark:text-[#7C9BFF]">
                            {cat.arabicName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                        {cat.description || "No description"}
                      </p>
                      <p className="text-[11px] text-[#57534E] dark:text-[#9CA3AF] pt-1">
                        {cat._count.kitabs} Kitab(s) · {cat._count.notes} Note(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="p-1.5 text-[#57534E] hover:text-[#0227a1] dark:hover:text-[#7C9BFF] cursor-pointer"
                        title="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-[#57534E] hover:text-red-600 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT */}
      {tab === "account" && (
        <div className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-4 max-w-lg">
          <h2 className="font-semibold text-base">Account & Theme</h2>
          <div className="text-xs space-y-1.5">
            <p>
              <span className="text-[#57534E] dark:text-[#9CA3AF]">Name: </span>
              {user?.name}
            </p>
            <p>
              <span className="text-[#57534E] dark:text-[#9CA3AF]">Email: </span>
              {user?.email}
            </p>
          </div>
          <div className="pt-3 border-t border-[#E7E5E4] dark:border-[#2A2E35] flex items-center justify-between">
            <p className="text-xs font-medium">Appearance</p>
            <ThemeToggle showLabel />
          </div>
        </div>
      )}
    </div>
  );
}