'use client';

import React from 'react';
import { Scissors, FileCheck2, Sparkles, FolderCheck, CheckCircle2 } from 'lucide-react';

interface NotificationBannerGraphicProps {
  type?: string;
  title?: string;
}

export default function NotificationBannerGraphic({ type, title }: NotificationBannerGraphicProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-line bg-gradient-to-r from-[#1796A6] via-[#20B4C8] to-[#12808E] p-5 sm:p-7 text-white flex items-center justify-center min-h-[140px] sm:min-h-[170px] select-none shadow-sm">
      {/* Background ambient lighting/patterns */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #ffffff 0%, transparent 60%), radial-gradient(circle at 80% 70%, #064E58 0%, transparent 70%)',
        }}
      />
      
      {/* Soft decorative stitch line across top & bottom */}
      <div className="absolute top-2 left-4 right-4 h-px border-t border-white/20 border-dashed" />
      <div className="absolute bottom-2 left-4 right-4 h-px border-b border-white/20 border-dashed" />

      {/* Center Illustration Composite (similar to Screenshot 3 reference) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Yellow/Amber Folder Body */}
          <div className="relative w-28 h-20 sm:w-36 sm:h-24 bg-[#F8BA15] rounded-xl shadow-md flex items-center justify-center border-t border-amber-200">
            {/* Folder Tab */}
            <div className="absolute -top-3 left-3 w-12 sm:w-16 h-4 bg-[#E2A40E] rounded-t-lg" />

            {/* Document Sheets emerging from folder */}
            <div className="absolute -top-4 sm:-top-5 w-20 sm:w-24 h-20 sm:h-24 bg-white rounded-lg shadow-sm border border-stone-200 p-2 sm:p-2.5 flex flex-col gap-1.5 transform -rotate-2">
              <div className="w-8 sm:w-10 h-1.5 bg-stone-300 rounded-full" />
              <div className="w-14 sm:w-16 h-1 bg-stone-200 rounded-full" />
              <div className="w-12 sm:w-14 h-1 bg-stone-200 rounded-full" />
              <div className="mt-1 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[8px] font-bold">✓</span>
                <span className="w-8 h-1 bg-emerald-200 rounded-full" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 text-amber-600 flex items-center justify-center text-[8px] font-bold">✓</span>
                <span className="w-6 h-1 bg-amber-200 rounded-full" />
              </div>
            </div>

            {/* Second back sheet */}
            <div className="absolute -top-3 sm:-top-4 w-20 sm:w-24 h-18 sm:h-22 bg-[#FAF6F3] rounded-lg shadow-sm border border-stone-300 p-2 -rotate-6 -z-10" />

            {/* Folder Front Flap */}
            <div className="absolute bottom-0 inset-x-0 h-12 sm:h-14 bg-[#FFC526] rounded-b-xl border-t border-amber-300/40 flex items-center justify-center">
              {/* SUTURA Scissors / Tailor watermark emblem */}
              <div className="w-7 h-7 rounded-full bg-amber-600/15 flex items-center justify-center text-amber-900/60">
                <Scissors size={14} className="rotate-45" />
              </div>
            </div>
          </div>

          {/* Magnifying Glass (right side) */}
          <div className="absolute -right-5 sm:-right-7 -bottom-2 sm:-bottom-3 transform rotate-12">
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full border-4 border-sky-600 bg-sky-200/30 backdrop-blur-[1px] shadow-sm flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-white/40 border border-white/60" />
              {/* Handle */}
              <div className="absolute -bottom-3 -right-2 w-2.5 h-5 bg-sky-700 rounded-sm transform rotate-45" />
            </div>
          </div>

          {/* Color Pencils / Chalk at bottom left */}
          <div className="absolute -left-4 sm:-left-6 -bottom-1 flex items-center -space-x-1 transform -rotate-12">
            <div className="w-6 sm:w-8 h-2 bg-pink-500 rounded-l-sm shadow-sm" />
            <div className="w-7 sm:w-9 h-2.5 bg-orange-400 rounded-l-sm shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
