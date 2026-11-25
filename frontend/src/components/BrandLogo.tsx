import { BookOpen } from "lucide-react";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${
          size === "sm" ? "w-9 h-9" : "w-10 h-10"
        } rounded-lg bg-[#F0FDFA] dark:bg-[#0F766E]/20 border border-[#CCFBF1] dark:border-[#115E59] flex items-center justify-center shrink-0`}
      >
        <BookOpen className="w-5 h-5 text-[#0F766E] dark:text-[#2DD4BF]" />
      </div>
      <div className="leading-none">
        <div
          className={`font-arabic font-bold text-[#0F766E] dark:text-[#2DD4BF] ${
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