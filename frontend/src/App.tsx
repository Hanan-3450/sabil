import { useState } from "react";
import { BookOpen, Moon, Sun } from "lucide-react";

export default function App() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sabil-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] dark:bg-[#0F766E]/20 border border-[#CCFBF1] dark:border-[#115E59] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
            </div>
            <div className="leading-tight">
              <div className="font-arabic text-2xl font-bold text-[#0F766E] dark:text-[#2DD4BF]">
                سَبِيل
              </div>
              <div className="text-xs font-semibold tracking-wider uppercase text-[#57534E] dark:text-[#9CA3AF]">
                Sabil
              </div>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-sm text-[#57534E] dark:text-[#9CA3AF]">
          Module 0 complete. Warm Paper & Quiet Night Study themes are active.
        </p>
      </div>
    </div>
  );
}