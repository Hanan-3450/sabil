import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import {
  PdfStudyViewer,
  type BookmarkInfo,
} from "../components/PdfStudyViewer";

interface CategoryOption {
  id: string;
  name: string;
  arabicName: string | null;
}

interface KitabSummary {
  id: string;
  categoryId: string;
  title: string;
  author: string | null;
}

interface AudioTrackItem {
  id: string;
  title: string;
  trackNumber: number;
  audioFileName: string;
  status: "NOT_FINISHED" | "FINISHED";
  lastPositionSec: number;
  audioUrl: string;
}

interface NoteItem {
  id: string;
  categoryId: string;
  kitabId: string;
  dersTitle: string;
  dersNumber: number | null;
  content: string;
  updatedAt: string;
  category: { id: string; name: string };
  kitab: { id: string; title: string };
}

interface LoadedKitab {
  id: string;
  title: string;
  author: string | null;
  description: string;
  categoryId: string;
  category: { id: string; name: string; arabicName: string | null };
  pdfFileName: string | null;
  pdfUrl: string | null;
  bookmark: BookmarkInfo | null;
  audioTracks: AudioTrackItem[];
  notes: NoteItem[];
}

export function LearnPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCatId = searchParams.get("categoryId") || "";
  const initialKitabId = searchParams.get("kitabId") || "";

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [allKitabs, setAllKitabs] = useState<KitabSummary[]>([]);
  const [selectedCatId, setSelectedCatId] = useState(initialCatId);
  const [selectedKitabId, setSelectedKitabId] = useState(initialKitabId);

  const [kitab, setKitab] = useState<LoadedKitab | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingKitab, setLoadingKitab] = useState(false);
  const [error, setError] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const lastSavedSecRef = useRef<number>(0);

  const [rightTab, setRightTab] = useState<"tracks" | "notes">("tracks");
  const [mobilePane, setMobilePane] = useState<"pdf" | "tracks" | "notes">(
    "pdf"
  );

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [dersTitle, setDersTitle] = useState("Ders 1");
  const [dersNumber, setDersNumber] = useState("1");
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<{ categories: CategoryOption[] }>("/api/categories"),
      apiFetch<{ kitabs: KitabSummary[] }>("/api/kitabs"),
    ])
      .then(([catRes, kitabRes]) => {
        setCategories(catRes.categories);
        setAllKitabs(kitabRes.kitabs);

        if (!initialCatId && initialKitabId) {
          const found = kitabRes.kitabs.find((k) => k.id === initialKitabId);
          if (found) setSelectedCatId(found.categoryId);
        }
      })
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to load library"
        )
      )
      .finally(() => setLoadingInit(false));
  }, []);

  const filteredKitabs = useMemo(() => {
    if (!selectedCatId) return allKitabs;
    return allKitabs.filter((k) => k.categoryId === selectedCatId);
  }, [allKitabs, selectedCatId]);

  useEffect(() => {
    if (!selectedKitabId) {
      setKitab(null);
      setActiveTrackId(null);
      return;
    }

    setLoadingKitab(true);
    setError("");
    apiFetch<{ kitab: LoadedKitab }>(`/api/learn/kitabs/${selectedKitabId}`)
      .then((res) => {
        setKitab(res.kitab);
        const firstUnfinished =
          res.kitab.audioTracks.find((t) => t.status === "NOT_FINISHED") ||
          res.kitab.audioTracks[0];
        setActiveTrackId(firstUnfinished?.id || null);

        const nextNum = res.kitab.notes.length + 1;
        setDersNumber(String(nextNum));
        setDersTitle(`Ders ${nextNum}`);
      })
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Could not open Kitab"
        )
      )
      .finally(() => setLoadingKitab(false));
  }, [selectedKitabId]);

  const activeTrack = useMemo(
    () => kitab?.audioTracks.find((t) => t.id === activeTrackId) || null,
    [kitab, activeTrackId]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;
    audio.playbackRate = playbackRate;
    lastSavedSecRef.current = activeTrack.lastPositionSec || 0;
  }, [activeTrackId, playbackRate]);

  const handleCategoryPick = (catId: string) => {
    setSelectedCatId(catId);
    setSelectedKitabId("");
    setSearchParams(catId ? { categoryId: catId } : {});
  };

  const handleKitabPick = (kitabId: string) => {
    setSelectedKitabId(kitabId);
    const params: Record<string, string> = {};
    if (selectedCatId) params.categoryId = selectedCatId;
    if (kitabId) params.kitabId = kitabId;
    setSearchParams(params);
  };

  const saveTrackPosition = async (trackId: string, sec: number) => {
    const rounded = Math.floor(sec);
    if (Math.abs(rounded - lastSavedSecRef.current) < 5) return;
    lastSavedSecRef.current = rounded;
    try {
      await apiFetch(`/api/learn/tracks/${trackId}`, {
        method: "PATCH",
        body: JSON.stringify({ lastPositionSec: rounded }),
      });
    } catch {
      // Ignore silent background progress errors
    }
  };

  const handleTrackStatusChange = async (
    trackId: string,
    status: "NOT_FINISHED" | "FINISHED"
  ) => {
    setKitab((prev) =>
      prev
        ? {
            ...prev,
            audioTracks: prev.audioTracks.map((t) =>
              t.id === trackId ? { ...t, status } : t
            ),
          }
        : prev
    );

    try {
      await apiFetch(`/api/learn/tracks/${trackId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save track status"
      );
    }
  };

  const handleSaveBookmark = async (
    pageNumber: number,
    label: string | null
  ) => {
    if (!kitab) return;
    const { bookmark } = await apiFetch<{ bookmark: BookmarkInfo }>(
      `/api/learn/kitabs/${kitab.id}/bookmark`,
      {
        method: "PUT",
        body: JSON.stringify({ pageNumber, label }),
      }
    );
    setKitab((prev) => (prev ? { ...prev, bookmark } : prev));
  };

  const handleCreateNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!kitab) return;
    setSavingNote(true);
    setError("");
    try {
      const parsedNum = parseInt(dersNumber, 10);
      const { note } = await apiFetch<{ note: NoteItem }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          kitabId: kitab.id,
          dersTitle,
          dersNumber: Number.isNaN(parsedNum) ? null : parsedNum,
          content: noteContent,
        }),
      });
      setKitab((prev) =>
        prev ? { ...prev, notes: [...prev.notes, note] } : prev
      );
      const nextNum =
        (Number.isNaN(parsedNum) ? kitab.notes.length + 1 : parsedNum) + 1;
      setDersNumber(String(nextNum));
      setDersTitle(`Ders ${nextNum}`);
      setNoteContent("");
      setShowNoteForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleUpdateNote = async (e: FormEvent, noteId: string) => {
    e.preventDefault();
    try {
      const { note } = await apiFetch<{ note: NoteItem }>(
        `/api/notes/${noteId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            dersTitle: editNoteTitle,
            content: editNoteContent,
          }),
        }
      );
      setKitab((prev) =>
        prev
          ? {
              ...prev,
              notes: prev.notes.map((n) => (n.id === noteId ? note : n)),
            }
          : prev
      );
      setEditingNoteId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await apiFetch(`/api/notes/${noteId}`, { method: "DELETE" });
      setKitab((prev) =>
        prev
          ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }
          : prev
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete note");
    }
  };

  if (loadingInit) {
    return (
      <div className="text-sm text-[#57534E] dark:text-[#9CA3AF]">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Selector Bar */}
      <div className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard"
              className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] hover:bg-[#FAF8F5] dark:hover:bg-[#121417]"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                {kitab ? kitab.title : "Learning Workspace"}
              </h1>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                {kitab
                  ? `${kitab.category.name}${kitab.author ? ` · ${kitab.author}` : ""}`
                  : "Pick a category and Kitab"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCatId}
              onChange={(e) => handleCategoryPick(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-xs font-medium"
              aria-label="Select Category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.arabicName ? `(${c.arabicName})` : ""}
                </option>
              ))}
            </select>

            <select
              value={selectedKitabId}
              onChange={(e) => handleKitabPick(e.target.value)}
              className="flex-1 sm:flex-none min-w-[200px] px-3 py-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-xs font-medium"
              aria-label="Select Kitab"
            >
              <option value="">— Select a Kitab —</option>
              {filteredKitabs.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Kitab Cards Picker when none selected */}
      {!selectedKitabId && (
        <div>
          {allKitabs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-10 text-center space-y-3">
              <p className="text-sm font-medium">No Kitabs yet</p>
              <Link
                to="/settings"
                className="inline-block px-4 py-2 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium"
              >
                Add Kitab in Settings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredKitabs.map((k) => {
                const cat = categories.find((c) => c.id === k.categoryId);
                return (
                  <button
                    key={k.id}
                    onClick={() => handleKitabPick(k.id)}
                    className="text-left rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 hover:border-[#0227a1] dark:hover:border-[#7C9BFF] transition-colors space-y-1 cursor-pointer"
                  >
                    <span className="text-[11px] font-medium text-[#0227a1] dark:text-[#7C9BFF]">
                      {cat?.name || "Kitab"}
                    </span>
                    <h3 className="font-semibold text-base">{k.title}</h3>
                    {k.author && (
                      <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                        By {k.author}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedKitabId && loadingKitab && (
        <div className="text-sm text-[#57534E] dark:text-[#9CA3AF]">
          Opening Kitab...
        </div>
      )}

      {/* Active Workspace */}
      {kitab && !loadingKitab && (
        <div className="space-y-4">
          {/* Mobile Pane Switcher */}
          <div className="grid grid-cols-3 gap-1.5 lg:hidden">
            {[
              { id: "pdf", label: "PDF", icon: BookOpen },
              {
                id: "tracks",
                label: `Audio (${kitab.audioTracks.length})`,
                icon: Headphones,
              },
              {
                id: "notes",
                label: `Notes (${kitab.notes.length})`,
                icon: NotebookPen,
              },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMobilePane(id as typeof mobilePane)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border cursor-pointer ${
                  mobilePane === id
                    ? "bg-[#0227a1] text-white border-[#0227a1]"
                    : "bg-white dark:bg-[#1A1D21] border-[#E7E5E4] dark:border-[#2A2E35]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Audio Player Bar */}
          {activeTrack && (
            <div className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Headphones className="w-4 h-4 text-[#0227a1] dark:text-[#7C9BFF] shrink-0" />
                  <span className="text-xs font-semibold text-[#0227a1] dark:text-[#7C9BFF] shrink-0">
                    #{activeTrack.trackNumber}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {activeTrack.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setPlaybackRate(speed)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                        playbackRate === speed
                          ? "bg-[#0227a1] text-white"
                          : "bg-[#FAF8F5] dark:bg-[#121417] border border-[#E7E5E4] dark:border-[#2A2E35] text-[#57534E] dark:text-[#9CA3AF]"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <audio
                ref={audioRef}
                key={activeTrack.id}
                controls
                src={activeTrack.audioUrl}
                onLoadedMetadata={(e) => {
                  const el = e.currentTarget;
                  el.playbackRate = playbackRate;
                  if (
                    activeTrack.lastPositionSec > 0 &&
                    el.duration > activeTrack.lastPositionSec
                  ) {
                    el.currentTime = activeTrack.lastPositionSec;
                  }
                }}
                onTimeUpdate={(e) =>
                  saveTrackPosition(activeTrack.id, e.currentTarget.currentTime)
                }
                onPause={(e) =>
                  saveTrackPosition(activeTrack.id, e.currentTarget.currentTime)
                }
                className="w-full h-9"
              />
            </div>
          )}

          {/* Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div
              className={`lg:col-span-7 ${
                mobilePane === "pdf" ? "block" : "hidden lg:block"
              }`}
            >
              <PdfStudyViewer
                pdfUrl={kitab.pdfUrl}
                pdfFileName={kitab.pdfFileName}
                bookmark={kitab.bookmark}
                onSaveBookmark={handleSaveBookmark}
              />
            </div>

            <div
              className={`lg:col-span-5 space-y-4 ${
                mobilePane === "pdf" ? "hidden lg:block" : "block"
              }`}
            >
              {/* Desktop Tab Switcher */}
              <div className="hidden lg:grid grid-cols-2 gap-2 rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-1.5">
                <button
                  onClick={() => setRightTab("tracks")}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    rightTab === "tracks"
                      ? "bg-[#0227a1] text-white"
                      : "text-[#57534E] dark:text-[#9CA3AF] hover:text-[#1C1917] dark:hover:text-[#ECEAE4]"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Audio ({kitab.audioTracks.length})</span>
                </button>
                <button
                  onClick={() => setRightTab("notes")}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    rightTab === "notes"
                      ? "bg-[#0227a1] text-white"
                      : "text-[#57534E] dark:text-[#9CA3AF] hover:text-[#1C1917] dark:hover:text-[#ECEAE4]"
                  }`}
                >
                  <NotebookPen className="w-3.5 h-3.5" />
                  <span>Notes ({kitab.notes.length})</span>
                </button>
              </div>

              {/* AUDIO TRACKS */}
              <div
                className={`rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 space-y-3 ${
                  mobilePane === "tracks" ||
                  (mobilePane !== "notes" && rightTab === "tracks")
                    ? "block"
                    : "hidden"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Audio Tracks</h2>
                  <span className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                    {
                      kitab.audioTracks.filter((t) => t.status === "FINISHED")
                        .length
                    }
                    /{kitab.audioTracks.length} finished
                  </span>
                </div>

                {kitab.audioTracks.length === 0 ? (
                  <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] py-6 text-center">
                    No audio tracks yet. Upload them in Settings.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {kitab.audioTracks.map((track) => {
                      const isActive = track.id === activeTrackId;
                      return (
                        <div
                          key={track.id}
                          className={`rounded-xl border p-3 space-y-2.5 transition-colors ${
                            isActive
                              ? "border-[#0227a1] dark:border-[#7C9BFF] bg-[#0227a1]/5 dark:bg-[#0227a1]/20"
                              : "border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveTrackId(track.id)}
                            className="w-full text-left flex items-start justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-[#0227a1] dark:text-[#7C9BFF]">
                                Track #{track.trackNumber}
                              </span>
                              <p className="text-sm font-medium truncate">
                                {track.title}
                              </p>
                            </div>
                            {isActive && (
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#0227a1] text-white shrink-0">
                                Playing
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-4 pt-1.5 border-t border-[#E7E5E4] dark:border-[#2A2E35] text-xs">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${track.id}`}
                                checked={track.status === "NOT_FINISHED"}
                                onChange={() =>
                                  handleTrackStatusChange(
                                    track.id,
                                    "NOT_FINISHED"
                                  )
                                }
                                className="accent-[#0227a1]"
                              />
                              <span
                                className={
                                  track.status === "NOT_FINISHED"
                                    ? "font-medium"
                                    : "text-[#57534E] dark:text-[#9CA3AF]"
                                }
                              >
                                Not Finished
                              </span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${track.id}`}
                                checked={track.status === "FINISHED"}
                                onChange={() =>
                                  handleTrackStatusChange(track.id, "FINISHED")
                                }
                                className="accent-[#0227a1]"
                              />
                              <span
                                className={
                                  track.status === "FINISHED"
                                    ? "font-medium text-[#0227a1] dark:text-[#7C9BFF]"
                                    : "text-[#57534E] dark:text-[#9CA3AF]"
                                }
                              >
                                Finished
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DERS NOTES */}
              <div
                className={`rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 space-y-3 ${
                  mobilePane === "notes" ||
                  (mobilePane !== "tracks" && rightTab === "notes")
                    ? "block"
                    : "hidden"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-sm">Ders Notes</h2>
                    <p className="text-[11px] text-[#57534E] dark:text-[#9CA3AF]">
                      {kitab.category.name} → {kitab.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoteForm((v) => !v)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Take Note</span>
                  </button>
                </div>

                {showNoteForm && (
                  <form
                    onSubmit={handleCreateNote}
                    className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-3 space-y-2.5"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={dersTitle}
                        onChange={(e) => setDersTitle(e.target.value)}
                        placeholder="Ders 1"
                        className="col-span-2 px-2.5 py-1.5 rounded-md border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs"
                      />
                      <input
                        type="number"
                        min={1}
                        value={dersNumber}
                        onChange={(e) => setDersNumber(e.target.value)}
                        placeholder="#"
                        className="px-2.5 py-1.5 rounded-md border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs"
                      />
                    </div>
                    <textarea
                      required
                      rows={4}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your ders notes..."
                      className="w-full px-2.5 py-2 rounded-md border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs leading-relaxed"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingNote}
                        className="px-3 py-1.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium cursor-pointer"
                      >
                        {savingNote ? "Saving..." : "Save Note"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNoteForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {kitab.notes.length === 0 ? (
                  <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] py-6 text-center">
                    No notes yet. Click "Take Note" to start.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                    {kitab.notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-3 space-y-2"
                      >
                        {editingNoteId === note.id ? (
                          <form
                            onSubmit={(e) => handleUpdateNote(e, note.id)}
                            className="space-y-2"
                          >
                            <input
                              type="text"
                              required
                              value={editNoteTitle}
                              onChange={(e) => setEditNoteTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-md border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs font-medium"
                            />
                            <textarea
                              required
                              rows={4}
                              value={editNoteContent}
                              onChange={(e) =>
                                setEditNoteContent(e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-md border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-[#0227a1] text-white text-xs cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-2.5 py-1 rounded border border-[#E7E5E4] dark:border-[#2A2E35] text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#0227a1] dark:text-[#7C9BFF]">
                                {note.dersTitle}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditNoteTitle(note.dersTitle);
                                    setEditNoteContent(note.content);
                                  }}
                                  className="p-1 text-[#57534E] hover:text-[#0227a1] dark:hover:text-[#7C9BFF] cursor-pointer"
                                  title="Edit note"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 text-[#57534E] hover:text-red-600 cursor-pointer"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">
                              {note.content}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}