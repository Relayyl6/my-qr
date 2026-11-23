'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UtensilsCrossed, Sparkles } from 'lucide-react';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl?: string;
  isSoldOut?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
}

export interface MenuProps {
  title: string;
  currency: string;
  sections: MenuSection[];
  bannerUrl?: string;
  logoUrl?: string;
  showBranding: boolean;
}

export default function MenuInteractiveView({
  title,
  currency = '$',
  sections = [],
  bannerUrl,
  logoUrl,
  showBranding = true,
}: MenuProps) {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'gf' | 'spicy'>('all');

  const allItems = sections.flatMap((s) => s.items.map((i) => ({ ...i, sectionName: s.name })));

  const filteredSections = sections
    .map((section) => {
      const items = section.items.filter((item) => {
        const matchesSection = activeSection === 'all' || activeSection === section.name;
        const matchesSearch =
          searchQuery.trim() === '' ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDietary =
          dietaryFilter === 'all' ||
          (dietaryFilter === 'veg' && item.isVegetarian) ||
          (dietaryFilter === 'gf' && item.isGlutenFree) ||
          (dietaryFilter === 'spicy' && item.isSpicy);

        return matchesSection && matchesSearch && matchesDietary;
      });
      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#11140F] flex flex-col justify-between selection:bg-[#2F6B4F] selection:text-white pb-12">
      {/* Top Banner / Hero */}
      <header className="bg-[#11140F] text-white pt-8 pb-8 px-4 sm:px-6 shadow-md text-center space-y-2 sticky top-0 z-30 relative overflow-hidden">
        {bannerUrl && (
          <div className="absolute inset-0 z-0 bg-black/40">
            <img
              src={getOptimizedStorageUrl(bannerUrl)}
              alt={title}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#11140F]/80 via-[#11140F]/70 to-[#11140F]" />
          </div>
        )}
        <div className="relative z-10 space-y-2">
          {logoUrl ? (
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 mx-auto flex items-center justify-center shadow-md border border-white/20 mb-2">
              <img
                src={getOptimizedStorageUrl(logoUrl)}
                alt={title}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/10 mx-auto flex items-center justify-center text-[#34D399] mb-2 border border-white/10">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
            {title}
          </h1>
          <p className="text-xs text-white/60 font-mono tracking-wider uppercase">
            Digital Dining Menu
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto pt-3">
            <div className="relative flex items-center bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-xs focus-within:border-[#34D399] transition-colors shadow-xs">
              <Search className="w-4 h-4 text-white/60 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, drinks, ingredients..."
                className="bg-transparent text-white placeholder-white/50 outline-none w-full text-xs"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Category Tabs & Dietary Filter Pills */}
        <div className="space-y-3">
          {/* Section Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSection === 'all'
                  ? 'bg-[#11140F] text-white shadow-sm'
                  : 'bg-white text-[#11140F]/70 border border-[#11140F]/10 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {sections.map((s) => (
              <button
                key={s.name}
                onClick={() => setActiveSection(s.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === s.name
                    ? 'bg-[#11140F] text-white shadow-sm'
                    : 'bg-white text-[#11140F]/70 border border-[#11140F]/10 hover:bg-gray-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#11140F]/40 font-mono text-[11px] uppercase mr-1">Filter:</span>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              🌱 Vegetarian
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'gf' ? 'all' : 'gf')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                dietaryFilter === 'gf'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              🌾 Gluten-Free
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'spicy' ? 'all' : 'spicy')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                dietaryFilter === 'spicy'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              🌶️ Spicy
            </button>
          </div>
        </div>

        {/* Menu Sections & Items */}
        {filteredSections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-[#11140F]/10 p-6 space-y-2">
            <p className="text-sm font-semibold text-[#11140F]">No items found matching your criteria</p>
            <p className="text-xs text-[#11140F]/50">Try clearing your search query or dietary filters.</p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.name} className="space-y-3">
              <h2 className="text-lg font-extrabold text-[#11140F] tracking-tight pb-1 border-b border-[#11140F]/10 flex items-center justify-between">
                <span>{section.name}</span>
                <span className="text-xs font-mono text-[#11140F]/40 font-normal">
                  {section.items.length} items
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs flex items-start gap-3.5 transition-all ${
                      item.isSoldOut
                        ? 'border-gray-200 opacity-60 bg-gray-50'
                        : 'border-[#11140F]/8 hover:border-[#11140F]/20'
                    }`}
                  >
                    {item.imageUrl && (
                      <img
                        src={getOptimizedStorageUrl(item.imageUrl)}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover shrink-0 border border-[#11140F]/8 shadow-xs bg-black/5"
                      />
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-[#11140F] leading-snug">
                            {item.title}
                          </h3>
                          <span className="font-mono font-bold text-sm text-[#2F6B4F] shrink-0">
                            {currency}{item.price}
                          </span>
                        </div>

                        <p className="text-xs text-[#11140F]/65 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isVegetarian && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              🌱 Veg
                            </span>
                          )}
                          {item.isGlutenFree && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                              🌾 GF
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                              🌶️ Spicy
                            </span>
                          )}
                        </div>

                        {item.isSoldOut && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

      </main>

      {/* Powered by DynamicQR Footer */}
      {showBranding && (
        <footer className="text-center pt-8">
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#11140F]/10 text-[11px] text-[#11140F]/60 hover:text-[#11140F] shadow-xs transition-colors"
          >
            <span>Powered by</span>
            <strong className="text-[#11140F] underline">Dynamic QR</strong>
            <span>• Contactless Dining</span>
          </a>
        </footer>
      )}
    </div>
  );
}
