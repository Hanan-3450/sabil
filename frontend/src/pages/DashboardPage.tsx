import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  NotebookPen,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface DashboardStats {
  totalCategories: number;
  totalKitabs: number;
  totalTracks: number;
  finishedTracks: number;
  completionPercent: number;
  totalNotes: number;
}

interface CategoryCard {
  id: string;
  name: string;
  arabicName: string | null;
  description: string;
  kitabCount: number;
  totalTracks: number;
  finishedTracks: number;
  notesCount: number;
}

interface KitabProgressItem {
  id: string;
  title: string;
  author: string | null;
  categoryId: string;
  categoryName: string;
  hasPdf: boolean;
  totalTracks: number;
  finishedTracks: number;
  notesCount: number;
  bookmarkPage: number | null;
  bookmarkLabel: string | null;
}

interface NoteItem {
  id: string;
  categoryId: string;
  kitabId: string;
  dersTitle: string;
  dersNumber: number | null;
  content: string;
  updatedAt: string;
  category: { id: string; name: string; arabicName: string | null };
  kitab: { id: string; title: string };
}

interface DashboardResponse {
  stats: DashboardStats;
  categories: CategoryCard[];
  kitabProgress: KitabProgressItem[];
  notes: NoteItem[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterCatId, setFilterCatId] = useState("");
  const [filterKitabId, setFilterKitabId] = useState("");

  useEffect(() => {
    apiFetch<DashboardResponse>("/api/dashboard")
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to load dashboard"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredNotes = useMemo(() => {
    if (!data) return [];
    return data.notes.filter((n) => {
      if (filterCatId && n.categoryId !== filterCatId) return false;
      if (filterKitabId && n.kitabId !== filterKitabId) return false;
      return true;
    });
  }, [data, filterCatId, filterKitabId]);

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Delete this saved note?")) return;
    try {
      await apiFetch(`/api/notes/${noteId}`, { method: "DELETE" });
      setData((prev) =>
        prev
          ? {
              ...prev,
              notes: prev.notes.filter((n) => n.id !== noteId),
              stats: {
                ...prev.stats,
                totalNotes: Math.max(0, prev.stats.totalNotes - 1),
              },
            }
          : prev
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete note"
      );
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-[#57534E] dark:text-[#9CA3AF]">
        Loading dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
        {error || "Unable to load dashboard."}
      </div>
    );
  }

  const { stats, categories, kitabProgress } = data;

  return (
    <div className="space-y-8">
      {/* Greeting + Start Learning Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-6 flex flex-col justify-between">
          <div>
            <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#0227a1]/8 dark:bg-[#0227a1]/30 text-[#0227a1] dark:text-[#7C9BFF]">
              Study Overview
            </span>
            <h1 className="text-2xl font-semibold mt-2">
              As-salamu alaykum, {user?.name}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-[#E7E5E4] dark:border-[#2A2E35]">
            <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121417] p-3 border border-[#E7E5E4] dark:border-[#2A2E35]">
              <p className="text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                Categories
              </p>
              <p className="text-lg font-semibold mt-0.5">
                {stats.totalCategories}
              </p>
            </div>
            <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121417] p-3 border border-[#E7E5E4] dark:border-[#2A2E35]">
              <p className="text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                Kitabs
              </p>
              <p className="text-lg font-semibold mt-0.5">{stats.totalKitabs}</p>
            </div>
            <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121417] p-3 border border-[#E7E5E4] dark:border-[#2A2E35]">
              <p className="text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                Ders Finished
              </p>
              <p className="text-lg font-semibold mt-0.5">
                {stats.finishedTracks}/{stats.totalTracks}
              </p>
            </div>
            <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121417] p-3 border border-[#E7E5E4] dark:border-[#2A2E35]">
              <p className="text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                Notes
              </p>
              <p className="text-lg font-semibold mt-0.5">{stats.totalNotes}</p>
            </div>
          </div>
        </div>

        {/* Start Learning Action Card */}
        <button
          type="button"
          onClick={() => navigate("/learn")}
          className="text-left rounded-2xl bg-[#0227a1] hover:bg-[#011d7a] text-white p-6 flex flex-col justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold">Start Learning</h2>
            <p className="text-xs text-white/85 mt-1.5 leading-relaxed">
              Open a Kitab PDF, audio tracks, and ders notes.
            </p>
          </div>
        </button>
      </div>

      {/* Progress Report */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Progress Report</h2>
          {kitabProgress.length === 0 && (
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0227a1] dark:text-[#7C9BFF] hover:underline"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Add Kitab in Settings</span>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Completion</span>
              <span className="text-[#0227a1] dark:text-[#7C9BFF] font-semibold">
                {stats.completionPercent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#FAF8F5] dark:bg-[#121417] border border-[#E7E5E4] dark:border-[#2A2E35] overflow-hidden">
              <div
                className="h-full bg-[#0227a1] dark:bg-[#7C9BFF] transition-all duration-300"
                style={{ width: `${stats.completionPercent}%` }}
              />
            </div>
          </div>

          {kitabProgress.length === 0 ? (
            <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
              No Kitabs added yet. Visit{" "}
              <Link
                to="/settings"
                className="text-[#0227a1] dark:text-[#7C9BFF] font-medium hover:underline"
              >
                Settings
              </Link>{" "}
              to upload your first PDF and audio tracks.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {kitabProgress.map((k) => {
                const pct =
                  k.totalTracks > 0
                    ? Math.round((k.finishedTracks / k.totalTracks) * 100)
                    : 0;
                return (
                  <Link
                    key={k.id}
                    to={`/learn?categoryId=${k.categoryId}&kitabId=${k.id}`}
                    className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-4 hover:border-[#0227a1] dark:hover:border-[#7C9BFF] transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-[#0227a1] dark:text-[#7C9BFF]">
                          {k.categoryName}
                        </span>
                        <h3 className="font-semibold text-sm truncate mt-0.5">
                          {k.title}
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] shrink-0">
                        {k.finishedTracks}/{k.totalTracks}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-[#E7E5E4] dark:bg-[#2A2E35] overflow-hidden">
                      <div
                        className="h-full bg-[#0227a1] dark:bg-[#7C9BFF]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                      <span className="inline-flex items-center gap-1">
                        {k.bookmarkPage ? (
                          <>
                            <Bookmark className="w-3 h-3 text-[#0227a1] dark:text-[#7C9BFF]" />
                            <span>Page {k.bookmarkPage}</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3" />
                            <span>{k.hasPdf ? "PDF ready" : "No PDF"}</span>
                          </>
                        )}
                      </span>
                      <span>{k.notesCount} note(s)</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Ders Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ders Categories</h2>
          <Link
            to="/settings"
            className="text-xs font-medium text-[#0227a1] dark:text-[#7C9BFF] hover:underline"
          >
            Manage →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/learn?categoryId=${cat.id}`}
              className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 hover:border-[#0227a1] dark:hover:border-[#7C9BFF] transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-base">{cat.name}</h3>
                  {cat.arabicName && (
                    <span className="font-arabic text-lg text-[#0227a1] dark:text-[#7C9BFF]">
                      {cat.arabicName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                  {cat.description || "Custom category"}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#E7E5E4] dark:border-[#2A2E35] flex items-center justify-between text-xs text-[#57534E] dark:text-[#9CA3AF]">
                <span>{cat.kitabCount} Kitab(s)</span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0227a1] dark:text-[#7C9BFF]" />
                  {cat.finishedTracks}/{cat.totalTracks}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Saved Ders Notes */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-[#0227a1] dark:text-[#7C9BFF]" />
            <h2 className="text-lg font-semibold">Saved Notes</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterCatId}
              onChange={(e) => {
                setFilterCatId(e.target.value);
                setFilterKitabId("");
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterKitabId}
              onChange={(e) => setFilterKitabId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs"
            >
              <option value="">All Kitabs</option>
              {kitabProgress
                .filter((k) => !filterCatId || k.categoryId === filterCatId)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-6 text-center text-xs text-[#57534E] dark:text-[#9CA3AF]">
            No saved notes yet. Notes written in the Learning Workspace appear here by Category and Kitab.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#0227a1]/8 dark:bg-[#0227a1]/30 text-[#0227a1] dark:text-[#7C9BFF] font-medium">
                      {note.category.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#121417] border border-[#E7E5E4] dark:border-[#2A2E35] font-medium">
                      {note.kitab.title}
                    </span>
                    <span className="font-semibold">• {note.dersTitle}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-[#57534E] hover:text-red-600 cursor-pointer shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#1C1917] dark:text-[#ECEAE4] whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  <Link
                    to={`/learn?categoryId=${note.categoryId}&kitabId=${note.kitabId}`}
                    className="text-[#0227a1] dark:text-[#7C9BFF] hover:underline"
                  >
                    Open Kitab →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}