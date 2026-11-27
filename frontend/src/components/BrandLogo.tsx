import { BookOpen } from "lucide-react";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${
          size === "sm" ? "w-9 h-9" : "w-10 h-10"
        } rounded-lg bg-[#0227a1]/8 dark:bg-[#0227a1]/30 border border-[#0227a1]/20 dark:border-[#7C9BFF]/30 flex items-center justify-center shrink-0`}
      >
        <BookOpen className="w-5 h-5 text-[#0227a1] dark:text-[#7C9BFF]" />
      </div>
      <div className="leading-none">
        <div
          className={`font-arabic font-bold text-[#0227a1] dark:text-[#7C9BFF] ${
            size === "sm" ? "text-xl" : "text-2xl"
          }`}
        >
          سَبِيل
        </div>
        <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#57534E] dark:text-[#9CA3AF] mt-0.5">
          Sabil
        </div>
      </div>
    </div>
  );
}