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

  // Note filters
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
        Loading your study dashboard...
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
        <div className="lg:col-span-2 rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#0F766E] dark:text-[#2DD4BF]">
              Student Workspace
            </p>
            <h1 className="text-2xl font-semibold mt-1">
              As-salamu alaykum, {user?.name}
            </h1>
            <p className="text-sm text-[#57534E] dark:text-[#9CA3AF] mt-1.5">
              Review your study progress across Islamic sciences, revisit saved notes, or open a Kitab to continue your ders.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-[#E7E5E4] dark:border-[#2A2E35]">
            <div>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                Categories
              </p>
              <p className="text-lg font-semibold">{stats.totalCategories}</p>
            </div>
            <div>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                Kitabs
              </p>
              <p className="text-lg font-semibold">{stats.totalKitabs}</p>
            </div>
            <div>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                Ders Finished
              </p>
              <p className="text-lg font-semibold">
                {stats.finishedTracks} / {stats.totalTracks}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                Saved Notes
              </p>
              <p className="text-lg font-semibold">{stats.totalNotes}</p>
            </div>
          </div>
        </div>

        {/* Start Learning Action Card */}
        <button
          type="button"
          onClick={() => navigate("/learn")}
          className="text-left rounded-xl border border-[#115E59]/30 dark:border-[#2DD4BF]/30 bg-[#0F766E] hover:bg-[#115E59] text-white p-6 flex flex-col justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <ArrowRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold">Start Learning</h2>
            <p className="text-sm text-white/85 mt-1">
              Select a category & Kitab to read the PDF, listen to audio tracks, and write ders notes.
            </p>
          </div>
        </button>
      </div>

      {/* Student Progress Report */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Student Progress Report</h2>
            <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
              Overall completion: {stats.completionPercent}% across all uploaded audio lessons
            </p>
          </div>
          {kitabProgress.length === 0 && (
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Upload your first Kitab</span>
            </Link>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Ders Progress</span>
            <span className="text-[#0F766E] dark:text-[#2DD4BF] font-semibold">
              {stats.completionPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#FAF8F5] dark:bg-[#121417] border border-[#E7E5E4] dark:border-[#2A2E35] overflow-hidden">
            <div
              className="h-full bg-[#0F766E] dark:bg-[#2DD4BF] transition-all duration-300"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>

          {kitabProgress.length === 0 ? (
            <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] pt-1">
              You haven’t added any Kitabs yet. Go to{" "}
              <Link
                to="/settings"
                className="text-[#0F766E] dark:text-[#2DD4BF] font-medium hover:underline"
              >
                Settings
              </Link>{" "}
              to create a Kitab and upload its PDF and audio tracks.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {kitabProgress.map((k) => {
                const pct =
                  k.totalTracks > 0
                    ? Math.round((k.finishedTracks / k.totalTracks) * 100)
                    : 0;
                return (
                  <Link
                    key={k.id}
                    to={`/learn?categoryId=${k.categoryId}&kitabId=${k.id}`}
                    className="rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-3.5 hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-[#0F766E] dark:text-[#2DD4BF]">
                          {k.categoryName}
                        </span>
                        <h3 className="font-medium text-sm truncate">
                          {k.title}
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-[#57534E] dark:text-[#9CA3AF] shrink-0">
                        {k.finishedTracks}/{k.totalTracks} tracks
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-[#E7E5E4] dark:bg-[#2A2E35] overflow-hidden">
                      <div
                        className="h-full bg-[#0F766E] dark:bg-[#2DD4BF]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                      <span className="inline-flex items-center gap-1">
                        {k.bookmarkPage ? (
                          <>
                            <Bookmark className="w-3 h-3 text-[#0F766E] dark:text-[#2DD4BF]" />
                            <span>
                              Stopped at Page {k.bookmarkPage}
                              {k.bookmarkLabel ? ` (${k.bookmarkLabel})` : ""}
                            </span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3" />
                            <span>{k.hasPdf ? "PDF ready" : "No PDF yet"}</span>
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

      {/* Current Ders Categories Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Current Ders Categories</h2>
          <Link
            to="/settings"
            className="text-xs font-medium text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
          >
            Manage categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/learn?categoryId=${cat.id}`}
              className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 hover:border-[#0F766E] dark:hover:border-[#2DD4BF] transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-base">{cat.name}</h3>
                  {cat.arabicName && (
                    <span className="font-arabic text-lg text-[#0F766E] dark:text-[#2DD4BF]">
                      {cat.arabicName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                  {cat.description || "Custom study category"}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#E7E5E4] dark:border-[#2A2E35] flex items-center justify-between text-xs text-[#57534E] dark:text-[#9CA3AF]">
                <span>{cat.kitabCount} Kitab(s)</span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF]" />
                  {cat.finishedTracks}/{cat.totalTracks} ders
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Study Notes Taken (Identifiable by Category & Kitab) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
            <h2 className="text-lg font-semibold">Saved Ders Notes</h2>
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
          <div className="rounded-xl border border-dashed border-[#E7E5E4] dark:border-[#2A2E35] p-6 text-center text-sm text-[#57534E] dark:text-[#9CA3AF]">
            No notes saved yet for this filter. Notes you write while studying a Kitab will appear here, organized by Category and Kitab.
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
                    <span className="px-2 py-0.5 rounded bg-[#F0FDFA] dark:bg-[#0F766E]/20 text-[#0F766E] dark:text-[#2DD4BF] font-medium">
                      {note.category.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#121417] border border-[#E7E5E4] dark:border-[#2A2E35] font-medium">
                      {note.kitab.title}
                    </span>
                    <span className="font-semibold text-[#1C1917] dark:text-[#ECEAE4]">
                      • {note.dersTitle}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-[#57534E] hover:text-red-600 cursor-pointer shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm text-[#1C1917] dark:text-[#ECEAE4] whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                  <span>
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/learn?categoryId=${note.categoryId}&kitabId=${note.kitabId}`}
                    className="text-[#0F766E] dark:text-[#2DD4BF] hover:underline"
                  >
                    Open in workspace →
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