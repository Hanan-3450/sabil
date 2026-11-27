import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  FileText,
  Headphones,
  Layers,
  NotebookPen,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const CORE_CATEGORIES = [
  { name: "Fiqhi", ar: "الفقه", desc: "Worship & daily rulings" },
  { name: "Hadith", ar: "الحديث", desc: "Prophetic narrations" },
  { name: "Sira", ar: "السيرة", desc: "Prophetic biography" },
  { name: "Aqida", ar: "العقيدة", desc: "Core Islamic creed" },
  { name: "Adab", ar: "الأدب", desc: "Manners & character" },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-[#E7E5E4] dark:border-[#2A2E35] bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/">
            <BrandLogo size="sm" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs sm:text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-[#57534E] dark:text-[#9CA3AF] hover:text-[#1C1917] dark:hover:text-[#ECEAE4]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-xs sm:text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: Clean 2-Column Layout */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-18 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#0227a1]/8 dark:bg-[#0227a1]/30 text-[#0227a1] dark:text-[#7C9BFF] border border-[#0227a1]/15 dark:border-[#7C9BFF]/25">
                Islamic Ders Study Workspace
              </span>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-snug">
                Your Kitab, audio lessons, and notes in one quiet space.
              </h1>

              <p className="text-base text-[#57534E] dark:text-[#9CA3AF] leading-relaxed max-w-xl">
                Upload your study PDFs and audio lectures, pin your last page, and keep clear notes for every ders.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0227a1] hover:bg-[#011d7a] text-white text-sm font-medium transition-colors"
                >
                  <span>{user ? "Open Dashboard" : "Start Studying"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {!user && (
                  <Link
                    to="/login"
                    className="px-5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] text-sm font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>

            {/* Realistic Study Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E5E4] dark:border-[#2A2E35] pb-3">
                  <div>
                    <p className="text-[11px] font-medium text-[#0227a1] dark:text-[#7C9BFF]">
                      Hadith · Riyad al-Salihin
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      Kitab Study Session
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-[#0227a1]/8 dark:bg-[#0227a1]/30 text-[#0227a1] dark:text-[#7C9BFF] font-medium">
                    <Bookmark className="w-3 h-3" />
                    Page 24
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0227a1] dark:text-[#7C9BFF]" />
                      Ders 01 — Sincerity of Intention
                    </span>
                    <span className="text-[#57534E] dark:text-[#9CA3AF]">
                      Finished
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#0227a1]/40 dark:border-[#7C9BFF]/40 bg-[#0227a1]/5 dark:bg-[#0227a1]/20 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <Headphones className="w-3.5 h-3.5 text-[#0227a1] dark:text-[#7C9BFF]" />
                      Ders 02 — Patience & Steadfastness
                    </span>
                    <span className="text-[#0227a1] dark:text-[#7C9BFF] font-medium">
                      Playing
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-[#FAF8F5] dark:bg-[#121417] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#0227a1] dark:text-[#7C9BFF]">
                    <FileText className="w-3 h-3" />
                    <span>Saved Note · Ders 02</span>
                  </div>
                  <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                    Three levels of sabr mentioned in the commentary; revisit Hadith #27.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Core Feature Cards */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-2">
              <Layers className="w-5 h-5 text-[#0227a1] dark:text-[#7C9BFF]" />
              <h2 className="font-semibold text-base">Organized Library</h2>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                Group Kitabs by Islamic science or add your own categories anytime.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-2">
              <Headphones className="w-5 h-5 text-[#0227a1] dark:text-[#7C9BFF]" />
              <h2 className="font-semibold text-base">PDF & Audio Together</h2>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                Pin your last PDF page and mark each audio track Finished or Not Finished.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-2">
              <NotebookPen className="w-5 h-5 text-[#0227a1] dark:text-[#7C9BFF]" />
              <h2 className="font-semibold text-base">Notes per Ders</h2>
              <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                Save notes for every lesson, cleanly tagged by Category and Kitab.
              </p>
            </div>
          </div>
        </section>

        {/* 5 Included Sciences */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-14">
          <h2 className="text-base font-semibold mb-3">
            Default Study Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CORE_CATEGORIES.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 space-y-1"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-sm">{item.name}</span>
                  <span className="font-arabic text-lg text-[#0227a1] dark:text-[#7C9BFF]">
                    {item.ar}
                  </span>
                </div>
                <p className="text-xs text-[#57534E] dark:text-[#9CA3AF]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7E5E4] dark:border-[#2A2E35] py-5 px-4 text-center text-xs text-[#57534E] dark:text-[#9CA3AF]">
        سَبِيل · Sabil Islamic Ders Learning Platform
      </footer>
    </div>
  );
}