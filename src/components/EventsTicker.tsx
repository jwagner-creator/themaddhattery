import React, { useRef } from 'react';

const CALENDAR_URL = 'https://calendar.app.google/E3GBBynLhw2hcziN6';

interface EventItem {
  label: string;
  detail: string;
  upcoming?: boolean;
}

const PAST: EventItem[] = [
  { label: 'Capital Title', detail: '200+ guests · Austin, TX' },
  { label: 'MCA Connect / Microsoft Partner', detail: 'Las Colinas, TX' },
  { label: 'The Rustic', detail: '265 guests · Houston, TX' },
  { label: 'DEC Network (Sponsored by Charles Schwab)', detail: '100 guests · Ft. Worth, TX' },
  { label: 'Caveman', detail: 'Austin, TX' },
  { label: 'Round Top Antique Show', detail: 'The Arbors · Round Top, TX' },
  { label: 'Christmas on Mercer', detail: 'Dripping Springs, TX' },
  { label: 'San Angelo State University', detail: 'Football Game · September 2026' },
];

const UPCOMING: EventItem[] = [
  { label: 'Greater Killeen Community Clinic', detail: 'Fundraiser · November 2026', upcoming: true },
  { label: 'Western Midstream', detail: 'Scharbauer Sports Complex · Midland, TX · November 2026', upcoming: true },
  { label: 'Grizzly Industries', detail: 'Employee Appreciation · Golden Nugget Casino · Lake Charles, LA', upcoming: true },
  { label: 'Songs on the Frio', detail: 'Leaky, TX · November 2026', upcoming: true },
];

const Dot = () => (
  <span className="mx-4 text-[#c9a36a] select-none" aria-hidden>✦</span>
);

const EventsTicker: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Build one long list of all items, doubled for seamless loop
  const allItems = [...PAST, ...UPCOMING];
  const doubled = [...allItems, ...allItems];

  return (
    <div className="bg-[#2a2018] overflow-hidden py-0">
      {/* Two rows: past and upcoming */}
      <div className="border-b border-white/10">
        {/* Past events row */}
        <div className="flex items-center py-2.5 overflow-hidden">
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-[#c9a36a] font-semibold px-5 border-r border-white/10 mr-4 whitespace-nowrap">
            Past Events
          </span>
          <div className="overflow-hidden flex-1">
            <div className="flex animate-ticker whitespace-nowrap">
              {[...PAST, ...PAST].map((e, i) => (
                <span key={i} className="inline-flex items-center text-sm text-[#f3ead9]/80">
                  <span className="font-medium text-[#f3ead9]">{e.label}</span>
                  <span className="ml-1.5 text-[#9a8d78]">— {e.detail}</span>
                  <Dot />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming row */}
        <div className="flex items-center py-2.5 overflow-hidden">
          <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-[#c9a36a] font-semibold px-5 border-r border-white/10 mr-4 whitespace-nowrap">
            Coming Up
          </span>
          <div className="overflow-hidden flex-1">
            <div className="flex animate-ticker-slow whitespace-nowrap">
              {[...UPCOMING, ...UPCOMING].map((e, i) => (
                <span key={i} className="inline-flex items-center text-sm text-[#f3ead9]/80">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c9a36a] animate-pulse" />
                    <span className="font-medium text-[#f3ead9]">{e.label}</span>
                  </span>
                  <span className="ml-1.5 text-[#9a8d78]">— {e.detail}</span>
                  <Dot />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsTicker;
