import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Headphones,
  NotebookPen,
  Layers,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const CORE_SCIENCES = [
  { name: "Fiqhi", ar: "الفقه", desc: "Rulings of worship & daily conduct" },
  { name: "Hadith", ar: "الحديث", desc: "Prophetic narrations & commentary" },
  { name: "Sira", ar: "السيرة", desc: "Life of the Prophet ﷺ & early history" },
  { name: "Aqida", ar: "العقيدة", desc: "Foundational creed & pillars of faith" },
  { name: "Adab", ar: "الأدب", desc: "Character, manners & spiritual etiquette" },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-[#E7E5E4] dark:border-[#2A2E35] bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <BrandLogo size="sm" />
          </Link>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#57534E] dark:text-[#9CA3AF] hover:text-[#1C1917] dark:hover:text-[#ECEAE4]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F766E] dark:text-[#2DD4BF]">
              Self-Paced Islamic Ders Companion
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              Your Kitab, audio lectures, and ders notes — organized in one quiet space.
            </h1>
            <p className="text-base sm:text-lg text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
              Stop switching between scattered folders, audio channels, and notebooks. Upload your own study books and lecture recordings, mark where you paused, and keep structured notes by lesson.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-medium transition-colors"
              >
                <span>{user ? "Open Dashboard" : "Create Free Study Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] text-sm font-medium transition-colors"
                >
                  I already have an account
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* How Sabil Works */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-2.5">
              <Layers className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
              <h2 className="font-semibold text-base">Organized by Science</h2>
              <p className="text-sm text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                Start immediately with Fiqhi, Hadith, Sira, Aqida, and Adab, or add your own custom study categories anytime.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-[#0F766E] dark:text-[#2DD4BF]">
                <Headphones className="w-5 h-5" />
                <Bookmark className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-base">PDF & Audio Together</h2>
              <p className="text-sm text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                Read your Kitab beside the audio tracks, mark lessons Finished or Not Finished, and pin your exact last page.
              </p>
            </div>

            <div className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-5 space-y-2.5">
              <NotebookPen className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
              <h2 className="font-semibold text-base">Notes per Ders</h2>
              <p className="text-sm text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                Write notes for Ders 1, Ders 2, and beyond—automatically saved and searchable by Category and Kitab.
              </p>
            </div>
          </div>
        </section>

        {/* Core Sciences */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Included Study Categories</h2>
            <p className="text-sm text-[#57534E] dark:text-[#9CA3AF]">
              Automatically prepared for every student upon signup.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CORE_SCIENCES.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-4 space-y-1.5"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-sm">{item.name}</span>
                  <span className="font-arabic text-lg text-[#0F766E] dark:text-[#2DD4BF]">
                    {item.ar}
                  </span>
                </div>
                <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7E5E4] dark:border-[#2A2E35] py-6 px-4 text-center text-xs text-[#57534E] dark:text-[#9CA3AF]">
        سَبِيل — Sabil Islamic Ders Learning Platform
      </footer>
    </div>
  );
}