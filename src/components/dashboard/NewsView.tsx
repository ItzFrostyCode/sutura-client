import React from 'react';
import { ListChecks, Shirt, Sparkles, Wrench, type LucideIcon } from 'lucide-react';

export default function NewsView() {
  const newsItems: Array<{
    title: string;
    date: string;
    badge: string;
    badgeColor: string;
    content: string;
    Icon: LucideIcon;
  }> = [
    {
      title: "New Feature: Gown & Barong Rental Configurations Added",
      date: "June 20, 2026",
      badge: "Feature Update",
      badgeColor: "bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20",
      content: "Fashion designers and hybrid shops can now manage security deposits, late return fines, fitting limits, rescheduling charges, and select supported shipping options (Lalamove, Toktok, Grab Express, etc.) directly in their Settings panel.",
      Icon: Shirt,
    },
    {
      title: "Feature Update: Dynamic Custom Fields on Services",
      date: "June 20, 2026",
      badge: "Feature Update",
      badgeColor: "bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20",
      content: "You can now configure customized field specifications (like sports jersey names, numbers, or specific body choices) on each of your services, making bespoke orders extremely structured and error-free.",
      Icon: ListChecks,
    },
    {
      title: "Scheduled System Storage Maintenance",
      date: "June 18, 2026",
      badge: "Maintenance",
      badgeColor: "bg-[#B26959]/10 text-[#B26959] border-[#B26959]/20",
      content: "We will be executing database storage optimizations on June 25, 2026, from 2:00 AM to 2:05 AM PHT. Expected service disruption is less than 5 minutes. Thank you for your cooperation.",
      Icon: Wrench,
    },
    {
      title: "Welcome to SUTURA Tracker System!",
      date: "June 13, 2026",
      badge: "Announcement",
      badgeColor: "bg-blue-600/10 text-blue-600 border-blue-600/20",
      content: "Welcome to SUTURA Capstone Portal! We are live. Log in, configure your operating hours and map coordinates in Settings to let consumers find and contact your branches.",
      Icon: Sparkles,
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-[#2D2A26]">
      <div>
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-1">System News & Updates</h2>
        <p className="text-[#827A73] text-sm">Stay informed with direct announcements and platform releases from SUTURA admins.</p>
      </div>

      <div className="space-y-4">
        {newsItems.map((item) => (
          <div key={item.title} className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-xs hover:border-[#D1C7BD] transition-all">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-base text-[#2D2A26] flex items-center gap-2">
                <item.Icon size={17} className="text-[#9A8073] shrink-0" />
                {item.title}
              </h3>
              <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
            <p className="text-xs text-[#A8A19A] mb-3">{item.date}</p>
            <p className="text-sm text-[#524A44] leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
