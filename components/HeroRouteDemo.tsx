'use client';

import { useState } from 'react';

const DESTINATIONS = [
  { label: 'Summer Sale', url: '/sale/summer-2026', tag: 'Live' },
  { label: 'Fall Collection', url: '/shop/fall-collection', tag: 'Scheduled' },
  { label: 'Store Locator', url: '/find-a-store', tag: 'Draft' },
];

// Deterministic pseudo-random module pattern — decorative, not a scannable code.
function moduleGrid(seed: number) {
  const cells: boolean[] = [];
  let n = seed;
  for (let i = 0; i < 100; i++) {
    n = (n * 9301 + 49297) % 233280;
    cells.push(n / 233280 > 0.52);
  }
  return cells;
}

const GRID = moduleGrid(42);

function isFinderZone(i: number) {
  const row = Math.floor(i / 10);
  const col = i % 10;
  const inCorner = (r: number, c: number) => row >= r && row < r + 3 && col >= c && col < c + 3;
  return inCorner(0, 0) || inCorner(0, 7) || inCorner(7, 0);
}

export default function HeroRouteDemo() {
  const [active, setActive] = useState(0);
  const dest = DESTINATIONS[active];

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center gap-5">
          <div className="shrink-0 rounded-2xl bg-[#EEF0EA] p-3">
            <div className="grid grid-cols-10 grid-rows-10 gap-[1.5px] w-[104px] h-[104px]">
              {GRID.map((on, i) => (
                <div
                  key={i}
                  className={`rounded-[1px] ${isFinderZone(i) || on ? 'bg-[#11140F]' : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/50">Printed once, on every flyer</p>
            <p className="font-[var(--font-mono)] text-[13px] text-white/90 mt-1 break-all">
              dynamicqr.co/id/fall-promo
            </p>
          </div>
        </div>

        <div className="my-5 flex items-center gap-2 text-white/30">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px]">routes to</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div
          key={active}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-opacity duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{dest.label}</span>
            <span className="text-[11px] text-[#7FB89A]">{dest.tag}</span>
          </div>
          <p className="font-[var(--font-mono)] text-[12px] text-white/50 mt-1">yourstore.com{dest.url}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[12px] text-white/40">Same code. New destination.</p>
          <div className="flex gap-1.5">
            {DESTINATIONS.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${d.label} destination`}
                aria-pressed={active === i}
                className={`h-2 w-2 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7FB89A] ${
                  active === i ? 'bg-[#7FB89A]' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
