import { useEffect, useRef, useState, type FormEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface BookmarkInfo {
  pageNumber: number;
  label: string | null;
}

interface PdfStudyViewerProps {
  pdfUrl: string | null;
  pdfFileName: string | null;
  bookmark: BookmarkInfo | null;
  onSaveBookmark: (pageNumber: number, label: string | null) => Promise<void>;
}

export function PdfStudyViewer({
  pdfUrl,
  pdfFileName,
  bookmark,
  onSaveBookmark,
}: PdfStudyViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(
    bookmark?.pageNumber || 1
  );
  const [pageInput, setPageInput] = useState<string>(
    String(bookmark?.pageNumber || 1)
  );
  const [zoom, setZoom] = useState(1);
  const [nightPdf, setNightPdf] = useState(false);

  const [bookmarkLabel, setBookmarkLabel] = useState(bookmark?.label || "");
  const [showPinForm, setShowPinForm] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    const startPage = bookmark?.pageNumber || 1;
    setPageNumber(startPage);
    setPageInput(String(startPage));
    setBookmarkLabel(bookmark?.label || "");
  }, [pdfUrl, bookmark?.pageNumber, bookmark?.label]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(
          Math.max(280, Math.floor(entry.contentRect.width) - 24)
        );
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goToPage = (target: number) => {
    const clamped = Math.max(1, Math.min(numPages || target, target));
    setPageNumber(clamped);
    setPageInput(String(clamped));
  };

  const handlePageSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) goToPage(parsed);
  };

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPin(true);
    try {
      await onSaveBookmark(pageNumber, bookmarkLabel.trim() || null);
      setShowPinForm(false);
    } finally {
      setSavingPin(false);
    }
  };

  if (!pdfUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-10 text-center space-y-1.5">
        <p className="text-sm font-medium">No PDF uploaded yet</p>
        <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
          Upload the Kitab PDF under Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-[#E7E5E4] dark:border-[#2A2E35] flex flex-wrap items-center justify-between gap-2 bg-[#FAF8F5] dark:bg-[#121417]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] disabled:opacity-40 cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form
            onSubmit={handlePageSubmit}
            className="flex items-center gap-1.5 text-xs"
          >
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-12 px-2 py-1 text-center rounded-md border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-xs font-medium"
              aria-label="Page number"
            />
            <span className="text-[#57534E] dark:text-[#9CA3AF]">
              / {numPages || "—"}
            </span>
          </form>

          <button
            type="button"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={numPages > 0 && pageNumber >= numPages}
            className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] disabled:opacity-40 cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))
            }
            className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-[#57534E] dark:text-[#9CA3AF] w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))
            }
            className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setNightPdf((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              nightPdf
                ? "bg-[#0227a1] text-white border-[#0227a1]"
                : "border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-[#57534E] dark:text-[#9CA3AF]"
            }`}
            title="Night reading filter"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Night PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPinForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium cursor-pointer"
            title="Pin current page"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Pin Page {pageNumber}</span>
          </button>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] text-[#57534E] dark:text-[#9CA3AF] hover:text-[#1C1917]"
            title={`Open ${pdfFileName || "PDF"} in new tab`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Saved Marker Strip */}
      {bookmark && (
        <div className="px-3.5 py-2 border-b border-[#E7E5E4] dark:border-[#2A2E35] bg-[#0227a1]/8 dark:bg-[#0227a1]/25 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#0227a1] dark:text-[#7C9BFF]">
            <Bookmark className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>
              <strong>Marker:</strong> Page {bookmark.pageNumber}
              {bookmark.label ? ` — "${bookmark.label}"` : ""}
            </span>
          </div>
          {pageNumber !== bookmark.pageNumber && (
            <button
              type="button"
              onClick={() => goToPage(bookmark.pageNumber)}
              className="font-medium text-[#0227a1] dark:text-[#7C9BFF] hover:underline cursor-pointer shrink-0"
            >
              Jump →
            </button>
          )}
        </div>
      )}

      {/* Pin Form */}
      {showPinForm && (
        <form
          onSubmit={handlePinSubmit}
          className="px-3.5 py-2.5 border-b border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={bookmarkLabel}
            onChange={(e) => setBookmarkLabel(e.target.value)}
            placeholder={`Optional note for Page ${pageNumber}`}
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] text-xs"
          />
          <button
            type="submit"
            disabled={savingPin}
            className="px-3 py-1.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs font-medium cursor-pointer"
          >
            {savingPin ? "Saving..." : "Save Marker"}
          </button>
          <button
            type="button"
            onClick={() => setShowPinForm(false)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] text-xs cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* PDF Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 flex justify-center bg-[#F3F0EA] dark:bg-[#0D0F12] min-h-[480px] max-h-[75vh]"
      >
        <div
          className={
            nightPdf ? "invert-[0.88] hue-rotate-180 contrast-90" : ""
          }
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages: total }) => {
              setNumPages(total);
              if (bookmark?.pageNumber && bookmark.pageNumber <= total) {
                setPageNumber(bookmark.pageNumber);
                setPageInput(String(bookmark.pageNumber));
              }
            }}
            loading={
              <div className="py-16 text-xs text-[#57534E] dark:text-[#9CA3AF]">
                Loading PDF...
              </div>
            }
            error={
              <div className="py-16 text-xs text-red-600 dark:text-red-400">
                Could not preview inline. Use the open-in-tab button above.
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={Math.round(containerWidth * zoom)}
              renderTextLayer
              renderAnnotationLayer
            />
          </Document>
        </div>
      </div>
    </div>
  );
}