'use client';

import { useState, useMemo } from 'react';
import {
  Check,
  X,
  Search,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Share2,
  Globe,
  BarChart3,
  Bot,
  Server,
} from 'lucide-react';

export interface FeatureItem {
  name: string;
  category: string;
  description: string;
  free: string | boolean;
  pro: string | boolean;
  plus: string | boolean;
  ultra: string | boolean;
  isBespoke?: boolean;
}

export const CATEGORIES = [
  { id: 'routing', label: 'Autonomous Ingress & Routing (13)', icon: Clock },
  { id: 'qr', label: 'QR Engine & Formats (14)', icon: Zap },
  { id: 'marketing', label: 'Marketing, UTM & Pixels (14)', icon: Share2 },
  { id: 'security', label: 'Security & Access Control (12)', icon: ShieldCheck },
  { id: 'domains', label: 'Custom Domains & White-Label (12)', icon: Globe },
  { id: 'analytics', label: 'Analytics & Telemetry (13)', icon: BarChart3 },
  { id: 'ai', label: 'AI Suite & Mobile Showcases (12)', icon: Bot },
  { id: 'enterprise', label: 'Enterprise, API & SLA (12)', icon: Server },
];

export const MASTER_FEATURES: FeatureItem[] = [
  // 1. AUTONOMOUS INGRESS & SMART ROUTING (13 features)
  {
    name: 'Autonomous Ingress Matrix (Time-of-day scheduled routing)',
    category: 'routing',
    description: 'Switch destination URLs automatically by time window (e.g. Lunch 11:00-15:00, Dinner 19:00-Close)',
    free: false,
    pro: '2 Time Slots',
    plus: '5 Time Slots',
    ultra: 'Unlimited Matrix',
    isBespoke: true,
  },
  {
    name: 'Day-of-Week Scheduling',
    category: 'routing',
    description: 'Target specific days (Mon-Fri Weekdays vs Sat-Sun Weekends vs custom recurring days)',
    free: false,
    pro: 'Weekdays / Weekends',
    plus: 'Custom Recurring Days',
    ultra: 'Multi-Calendar & Holidays',
    isBespoke: true,
  },
  {
    name: 'Multi-Timezone Clock Alignment',
    category: 'routing',
    description: 'Evaluate schedules against UTC, US/Eastern, Europe, Africa, Asia, or scanner local timezone',
    free: false,
    pro: false,
    plus: 'All Timezones',
    ultra: 'Per-Branch Global Sync',
    isBespoke: true,
  },
  {
    name: 'Live Real-Time Active Slot Indicator',
    category: 'routing',
    description: 'Visual indicator of currently active scheduled slot pulsing in the workspace',
    free: false,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Device OS Targeting (iOS vs Android)',
    category: 'routing',
    description: 'Route iPhones to Apple App Store and Androids to Google Play Store seamlessly',
    free: false,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Desktop vs Mobile Traffic Splitting',
    category: 'routing',
    description: 'Send laptop/workstation scanners to desktop web app and smartphones to mobile app',
    free: false,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Geographic Country Routing (Geo-IP)',
    category: 'routing',
    description: 'Direct visitors based on 2-letter ISO country code (e.g. US, GB, CA, NG, DE)',
    free: false,
    pro: false,
    plus: 'Top 20 Countries',
    ultra: '240+ Global Nations',
  },
  {
    name: 'City & Regional Routing',
    category: 'routing',
    description: 'Route users to their nearest local city store or branch location',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Language & Locale Routing',
    category: 'routing',
    description: 'Match browser Accept-Language headers to serve English, Spanish, French, or German targets',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Referrer Domain Attribution Routing',
    category: 'routing',
    description: 'Detect scans arriving from TikTok, Instagram, Twitter/X, or search engines',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Priority-Ordered Waterfall Rule Engine',
    category: 'routing',
    description: 'Deterministic top-to-bottom priority evaluation with custom integer weights',
    free: false,
    pro: 'Up to 3 Rules',
    plus: 'Up to 10 Rules',
    ultra: 'Unlimited Waterfall',
  },
  {
    name: 'Guaranteed Fallback Destination URL',
    category: 'routing',
    description: 'Always ensures scanners reach a valid default destination if conditions do not match',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Zero-Latency In-Memory Edge Rule Caching',
    category: 'routing',
    description: 'Compiled routing matrices evaluated in sub-2ms on edge compute',
    free: false,
    pro: false,
    plus: 'Sub-15ms',
    ultra: 'Sub-2ms Dedicated Cache',
  },

  // 2. QR ENGINE & FORMATS (14 features)
  {
    name: 'Dynamic 307 Fast Edge Redirects',
    category: 'qr',
    description: 'Lightning-fast temporary redirects executed in under 20ms at nearest edge node',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Permanent Short Links (/id/code)',
    category: 'qr',
    description: 'Your physical printed QR code never breaks because destinations update in software',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: '300 DPI High-Resolution PNG Downloads',
    category: 'qr',
    description: 'Print-grade raster graphics with zero blurring or pixelation on physical flyers',
    free: 'Standard PNG (150 DPI)',
    pro: '300 DPI High-Res',
    plus: '300 DPI High-Res',
    ultra: '600 DPI Commercial Ultra-Res',
  },
  {
    name: 'Vector SVG Lossless Print Export',
    category: 'qr',
    description: 'Infinitely scalable vector formats for billboards, vinyl wraps, and print shops',
    free: false,
    pro: false,
    plus: 'Standard Vector SVG',
    ultra: 'Lossless CMYK Vector SVG/EPS',
  },
  {
    name: 'Offset Print PDF Templates (A4 & Letter)',
    category: 'qr',
    description: 'Ready-to-print full-page sheets with alignment guides and crop marks',
    free: false,
    pro: false,
    plus: 'Standard PDF',
    ultra: 'Commercial Die-Cut Bleed Guides',
  },
  {
    name: 'Table Tent Acrylic Sign Kits (4x6", 5x7")',
    category: 'qr',
    description: 'Pre-formatted vertical table displays designed for restaurant and bar tables',
    free: false,
    pro: false,
    plus: 'Standard Templates',
    ultra: 'Full Custom Die-Cuts',
  },
  {
    name: 'Square Instagram / Poster Aspect Ratio (1080x1350)',
    category: 'qr',
    description: 'High-contrast mobile format optimized for social media and event posters',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'CMYK Color-Space Print Compatibility',
    category: 'qr',
    description: 'Accurate commercial printer color rendering without muddy conversion artifacts',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Configurable Error Correction Levels (L, M, Q, H)',
    category: 'qr',
    description: 'Up to 30% damage recovery for scannability even when stained, scratched, or folded',
    free: 'Medium (15%)',
    pro: 'Medium (15%)',
    plus: 'High (25%)',
    ultra: 'Ultra (30%)',
  },
  {
    name: 'Custom Quiet Zone Buffer Padding',
    category: 'qr',
    description: 'Guaranteed 10% perimeter buffer ensuring camera lenses lock onto the matrix instantly',
    free: 'Fixed 10%',
    pro: 'Fixed 10%',
    plus: 'Configurable 5-15%',
    ultra: 'Sub-Pixel Micro Tuning',
  },
  {
    name: 'Custom Center Brand Logo Embed',
    category: 'qr',
    description: 'Embed your company logo in the center of the QR matrix with auto-calculated error budget',
    free: false,
    pro: false,
    plus: '1 Logo Upload',
    ultra: 'Unlimited Vector SVG Logos',
  },
  {
    name: 'Hide Link Slugs & Footers on Print',
    category: 'qr',
    description: 'Toggle off URLs and technical details on physical table tents for cleaner aesthetics',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'High-Contrast Color Palette Customization',
    category: 'qr',
    description: 'Customize QR dark modules and background colors while maintaining scannability',
    free: false,
    pro: '3 Preset Themes',
    plus: 'Custom Hex Palettes',
    ultra: 'Pantone & Gradient Matching',
  },
  {
    name: 'Bulk QR Code ZIP Batch Download',
    category: 'qr',
    description: 'Download up to 500 numbered and labeled QR PNG/SVG files in a single zip archive',
    free: false,
    pro: false,
    plus: false,
    ultra: 'Unlimited ZIP Batches',
    isBespoke: true,
  },

  // 3. MARKETING, RETARGETING & ATTRIBUTION (14 features)
  {
    name: 'Campaign UTM Parameter Builder',
    category: 'marketing',
    description: 'Interactive UTM generator for source, medium, campaign, term, and content tags',
    free: false,
    pro: 'Manual UTMs',
    plus: 'Auto-Tagging',
    ultra: 'Dynamic Multi-Variable Matrix',
    isBespoke: true,
  },
  {
    name: 'Automatic UTM Injection on Redirect',
    category: 'marketing',
    description: 'Appends attribution tags automatically to final destinations so Google Analytics knows exact source',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Meta (Facebook) Pixel Retargeting',
    category: 'marketing',
    description: 'Inject your Meta Pixel ID to build custom audiences from physical QR flyer scans',
    free: false,
    pro: false,
    plus: '1 Pixel',
    ultra: 'Unlimited Multi-Pixel + Server CAPI',
  },
  {
    name: 'Google Analytics 4 (GA4) Measurement ID',
    category: 'marketing',
    description: 'Fire real-time Google Analytics events before redirecting to external landing pages',
    free: false,
    pro: false,
    plus: '1 Stream',
    ultra: 'Multi-Property Streams',
  },
  {
    name: 'Google Tag Manager (GTM) Container Support',
    category: 'marketing',
    description: 'Deploy full GTM web containers on your custom mobile landing pages',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'TikTok Advertising Pixel Retargeting',
    category: 'marketing',
    description: 'Build retargeting pools for TikTok ad campaigns from in-store physical scans',
    free: false,
    pro: false,
    plus: '1 Pixel',
    ultra: 'Multi-Pixel Retargeting',
  },
  {
    name: 'LinkedIn Insight Tag Attribution',
    category: 'marketing',
    description: 'Track B2B physical conference attendee interactions and company demographics',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Custom OpenGraph Social Preview Title',
    category: 'marketing',
    description: 'Override social share title when links are sent over WhatsApp, Twitter, or iMessage',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Custom OpenGraph Social Description',
    category: 'marketing',
    description: 'Bespoke marketing copy displayed in messaging app preview bubbles',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Custom Social Share Thumbnail (OG Image)',
    category: 'marketing',
    description: 'Set custom rich banner previews on social feeds and chat apps',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Link Cloaking & Masked URL Presentation',
    category: 'marketing',
    description: 'Keep your branded short domain visible in browser address bars',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Native Mobile App Deep Linking',
    category: 'marketing',
    description: 'Open native app URI schemes (e.g. spotify://, instagram://, custom app URL schemes)',
    free: false,
    pro: 'Basic Universal Links',
    plus: 'Custom App Schemes',
    ultra: 'Fallback App Install Handshake',
  },
  {
    name: 'Cross-Channel Campaign Attribution Tags',
    category: 'marketing',
    description: 'Group QR links by marketing campaign, flyer drop, or geographic region',
    free: false,
    pro: 'Up to 5 Tags',
    plus: 'Unlimited Tags',
    ultra: 'Multi-Workspace Channel Groups',
  },
  {
    name: 'Dynamic QR Recycling (Zero Reprinting)',
    category: 'marketing',
    description: 'Re-assign printed physical QR codes to completely new marketing campaigns on the fly',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },

  // 4. SECURITY, PRIVACY & ACCESS CONTROL (12 features)
  {
    name: 'PIN & Passcode Protected Link Gates',
    category: 'security',
    description: 'Require scanners to enter a 4-digit PIN or password before unlocking content',
    free: false,
    pro: false,
    plus: 'Single PIN',
    ultra: 'Multi-User & Expiring PINs',
    isBespoke: true,
  },
  {
    name: 'Branded Passcode Unlock Screen',
    category: 'security',
    description: 'High-polish, mobile-optimized keypad with brute-force rate-limiting',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Scan Count Expiration Budget Caps',
    category: 'security',
    description: 'Automatically expire link after X total scans (e.g. first 200 coupon claimers only)',
    free: false,
    pro: false,
    plus: 'Up to 250 Scans',
    ultra: 'Unlimited Precise Burn Limits',
    isBespoke: true,
  },
  {
    name: 'Date & Time Auto-Expiration',
    category: 'security',
    description: 'Deactivate campaign link automatically at midnight or specified timestamp',
    free: false,
    pro: false,
    plus: '7-Day Limit',
    ultra: 'Precision Minute Scheduling',
  },
  {
    name: 'Expired Link Fallback Destination',
    category: 'security',
    description: 'Gracefully route late visitors to "Promotion Ended" or alternative sales page',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'One-Click Link Pause & Archive',
    category: 'security',
    description: 'Instantly pause QR code scans without deleting campaign telemetry or QR art',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Bot & Camera Crawler Filtering',
    category: 'security',
    description: 'Suppress scanner count inflation from search engine indexing bots and spiders',
    free: 'Basic Filtering',
    pro: 'Standard Defense',
    plus: 'Enhanced Heuristics',
    ultra: 'Real-Time ML Bot Defense',
  },
  {
    name: 'Camera Preview Prefetch Suppression',
    category: 'security',
    description: 'Prevents false scan counts triggered by iOS/Android camera preview popups',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: '1-Way Anonymized IP Hash Telemetry',
    category: 'security',
    description: 'Strict 100% GDPR and CCPA compliant visitor analytics without storing raw PII',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Automatic Let\'s Encrypt SSL Certificates',
    category: 'security',
    description: 'Automatic HTTPS TLS provisioning and 90-day renewal for all custom domains',
    free: false,
    pro: false,
    plus: '1 Domain SSL',
    ultra: 'Wildcard & Apex Domain SSL',
  },
  {
    name: 'End-to-End DNSSEC Domain Verification',
    category: 'security',
    description: 'Cryptographic CNAME verification preventing DNS hijacking or spoofing',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Multi-Factor Authenticated Admin Controls',
    category: 'security',
    description: 'Enterprise super-admin session protection and session revocation',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },

  // 5. CUSTOM DOMAINS & WHITE-LABEL BRANDING (12 features)
  {
    name: 'Custom Branded Domains (e.g. qr.yourbrand.com)',
    category: 'domains',
    description: 'Connect your own domain so customers see your brand instead of a generic shortener',
    free: false,
    pro: false,
    plus: '1 Custom Domain',
    ultra: 'Unlimited Custom Domains',
    isBespoke: true,
  },
  {
    name: 'Zero DynamicQR Branding on Print Materials',
    category: 'domains',
    description: 'Completely eliminate DynamicQR logos and badges from your physical posters and cards',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: '100% White-Label Redirect Experience',
    category: 'domains',
    description: 'Zero third-party footprint — full brand immersion from camera scan to landing page',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Custom Domain Root Redirect (/)',
    category: 'domains',
    description: 'Choose where visitors land if they visit your naked domain root (e.g. your home site)',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Custom 404 Not Found Fallback Destination',
    category: 'domains',
    description: 'Redirect mistyped shortcodes to your main store or dedicated support page',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Custom Favicon on Branded Redirects',
    category: 'domains',
    description: 'Display your company favicon during browser transit and landing showcase pages',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Instant DNS Verification Health Sentinel',
    category: 'domains',
    description: 'Continuous background polling verifying DNS CNAME propagation status',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Bespoke Custom Short Slugs (e.g. qr.co/vip-menu)',
    category: 'domains',
    description: 'Memorable vanity words instead of random alphanumeric strings',
    free: false,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Multi-Domain Workspace Partitioning',
    category: 'domains',
    description: 'Manage multiple brand domains or client properties inside a single workspace',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Automated SSL Renewal Pipeline',
    category: 'domains',
    description: 'Zero-maintenance edge TLS certificate rotation with automated ACME challenges',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Sub-Domain Routing Isolation',
    category: 'domains',
    description: 'Support any sub-domain structure (menu.brand.com, go.brand.com, scan.brand.com)',
    free: false,
    pro: false,
    plus: '1 Subdomain',
    ultra: 'Unlimited Subdomains',
  },
  {
    name: 'Agency White-Label Client Portal',
    category: 'domains',
    description: 'Shareable reporting views without exposing internal administration panels',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },

  // 6. ANALYTICS, TELEMETRY & INTELLIGENCE (13 features)
  {
    name: 'Real-Time Edge Scan Counter',
    category: 'analytics',
    description: 'Instantaneous tally of physical QR scans updated directly in database',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Unique Reach vs Scan Velocity Trends',
    category: 'analytics',
    description: 'Distinguish between repeat visitors and first-time unique individuals',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: '24-Hour Diurnal Peak Hours Heatmap',
    category: 'analytics',
    description: 'Hour-by-hour distribution revealing when your physical signs are most scanned',
    free: false,
    pro: 'Last 24 Hours Only',
    plus: 'Last 7 Days',
    ultra: 'Real-Time + Infinite Historical',
    isBespoke: true,
  },
  {
    name: 'Hardware & Platform Telemetry (Android vs iOS)',
    category: 'analytics',
    description: 'Detailed client breakdown across Google Android, Apple iOS, and desktop PCs',
    free: false,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Operating System Version Analytics',
    category: 'analytics',
    description: 'Granular OS versioning for tech marketing and mobile app optimization',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Browser Client Distribution',
    category: 'analytics',
    description: 'Breakdown of Safari, Chrome, Edge, and in-app camera webview browsers',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Inbound Referral Attribution Channels',
    category: 'analytics',
    description: 'Identify if visitors scanned via camera app or followed shared web links',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Top Performing QR Links Leaderboard',
    category: 'analytics',
    description: 'Rank physical locations (e.g. Table 4 vs Table 12 vs Street Poster)',
    free: 'Top 3',
    pro: 'Top 10',
    plus: 'Top 50',
    ultra: 'Unlimited Full Workspace',
  },
  {
    name: 'Geographic Country & City Telemetry',
    category: 'analytics',
    description: 'View which cities and nations generate the most foot traffic engagement',
    free: false,
    pro: 'Country Only',
    plus: 'Country + Top Cities',
    ultra: 'Real-Time City & ISP Geo-Drilldown',
  },
  {
    name: '1-Click Raw CSV Telemetry Export',
    category: 'analytics',
    description: 'Download complete timestamped scan records for analysis in Excel or Python',
    free: false,
    pro: false,
    plus: '1,000 Rows/mo',
    ultra: 'Uncapped CSV & Real-Time JSON',
  },
  {
    name: 'Weekly Automated Scan Digest Email',
    category: 'analytics',
    description: 'Automated executive summary sent to your inbox every Monday morning',
    free: false,
    pro: false,
    plus: true,
    ultra: true,
  },
  {
    name: 'Conversion Rate Telemetry (Scans → Signups)',
    category: 'analytics',
    description: 'Track downstream conversion efficiency from physical flyer scans into customers',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Historical Data Retention',
    category: 'analytics',
    description: 'How long scan logs and visitor telemetry are preserved in the database',
    free: '7 Days',
    pro: '30 Days',
    plus: '90 Days',
    ultra: 'Unlimited Forever',
  },

  // 7. AI CREATIVE SUITE & MOBILE SHOWCASES (12 features)
  {
    name: 'AI Smart Routing Rule Compiler',
    category: 'ai',
    description: 'Convert plain English instructions into strict redirect rules with neural AI',
    free: false,
    pro: 'Basic Prompts',
    plus: 'Full AI Compiler',
    ultra: 'Frontier Multi-Model Cascade',
    isBespoke: true,
  },
  {
    name: 'One-Click AI Destination URL Enricher',
    category: 'ai',
    description: 'Fetches web titles and writes high-converting marketing labels automatically',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Prompt-to-Page AI Mobile Landing Pages',
    category: 'ai',
    description: 'Generate stunning single-page mobile websites from a brief in 10 seconds',
    free: false,
    pro: false,
    plus: '3 Showcases',
    ultra: 'Unlimited Showcases',
    isBespoke: true,
  },
  {
    name: 'Adaptive Mobile Hero & Catalog Blocks',
    category: 'ai',
    description: 'Restaurant menus, link-in-bio portals, product drops, and booking buttons',
    free: false,
    pro: false,
    plus: 'Standard Templates',
    ultra: 'Full Custom Menus & Booking',
  },
  {
    name: 'Custom Call-to-Action Action Buttons',
    category: 'ai',
    description: 'Direct customers from your mobile showcase to order, call, map, or pay',
    free: false,
    pro: false,
    plus: 'Single CTA',
    ultra: 'Multi-CTA Action Dock',
  },
  {
    name: 'AI QR Art Studio (Diffusion-Style Icons)',
    category: 'ai',
    description: 'Transform boring QR matrices into photorealistic artistic masterpieces',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Computer-Vision Scannability Score (0-100%)',
    category: 'ai',
    description: 'Automated neural verification ensuring stylized QR codes scan reliably on all phone cameras',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'AI Campaign Orchestrator',
    category: 'ai',
    description: 'Generate UTMs, tags, and marketing schedules across multi-link batches',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Bulk URL AI Classifier & Parser',
    category: 'ai',
    description: 'Paste up to 500 URLs; AI extracts titles, tags, and generates shortcodes in seconds',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Neural Response Cache Engine',
    category: 'ai',
    description: 'Instant zero-cost AI generation for identical queries via database cache',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Generative Brand Color Extraction',
    category: 'ai',
    description: 'AI detects target website color schemes and applies them to mobile pages',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Instant 1-Click Revert to Direct URL',
    category: 'ai',
    description: 'Switch between interactive mobile landing pages and direct redirects in 1 second',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },

  // 8. ENTERPRISE, API & SLA (12 features)
  {
    name: 'Programmatic REST API Access',
    category: 'enterprise',
    description: 'Create, update, and manage QR links, routing rules, and metrics via API',
    free: false,
    pro: false,
    plus: false,
    ultra: '120+ req/min Burst',
    isBespoke: true,
  },
  {
    name: 'Instant Webhook Triggers on Scan',
    category: 'enterprise',
    description: 'POST real-time JSON payloads to your servers whenever a QR code is scanned',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Webhook Cryptographic HMAC Signature',
    category: 'enterprise',
    description: 'Verify webhook authenticity and protect against replay attacks with SHA256 signatures',
    free: false,
    pro: false,
    plus: false,
    ultra: true,
    isBespoke: true,
  },
  {
    name: 'Active Link Quota',
    category: 'enterprise',
    description: 'Total simultaneous live dynamic QR links supported in account',
    free: '5 Active',
    pro: '50 Active',
    plus: '500 Active',
    ultra: 'Unlimited',
  },
  {
    name: 'Monthly Scan Capacity',
    category: 'enterprise',
    description: 'Monthly physical scan redirects included with zero overage charges',
    free: '1,000 / mo',
    pro: '25,000 / mo',
    plus: '250,000 / mo',
    ultra: 'Unlimited',
  },
  {
    name: 'Monthly AI Intelligence Allowance',
    category: 'enterprise',
    description: 'Allowance for neural AI routing compilation, landing page creation, and art',
    free: '$0.50 / mo',
    pro: '$5.00 / mo',
    plus: '$15.00 / mo',
    ultra: '$50.00 / mo',
  },
  {
    name: 'Multi-Tenant Data Isolation',
    category: 'enterprise',
    description: 'Strict foreign key tenant boundaries ensuring complete privacy on Neon PostgreSQL',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Team Workspaces & Multi-Seat RBAC',
    category: 'enterprise',
    description: 'Add team members with role-based access controls (Admin, Editor, Viewer)',
    free: false,
    pro: false,
    plus: false,
    ultra: 'Unlimited Seats & Roles',
    isBespoke: true,
  },
  {
    name: 'Priority Neural AI Compute Queue',
    category: 'enterprise',
    description: 'Bypasses standard queue for sub-second AI landing page and art generation',
    free: false,
    pro: false,
    plus: false,
    ultra: 'Dedicated Priority Queue',
    isBespoke: true,
  },
  {
    name: '99.99% Edge Routing Uptime SLA',
    category: 'enterprise',
    description: 'Guaranteed high availability backed by serverless global Neon edge infrastructure',
    free: 'Best-Effort',
    pro: 'Standard SLA',
    plus: '99.5% SLA',
    ultra: '99.99% Enterprise SLA',
  },
  {
    name: 'Cancel or Switch Plans Anytime',
    category: 'enterprise',
    description: 'Zero lock-in. Printed codes stay live permanently even if you change plans',
    free: true,
    pro: true,
    plus: true,
    ultra: true,
  },
  {
    name: 'Customer Engineering Support',
    category: 'enterprise',
    description: 'Direct access to senior engineers for domain setup, API integrations, and SLA',
    free: 'Community',
    pro: 'Email (48h)',
    plus: 'Priority Email (24h)',
    ultra: 'Dedicated Slack/Lead (1h)',
  },
];

export default function ComprehensiveFeatureMatrix() {
  const [selectedCategory, setSelectedCategory] = useState<string>('routing');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategoryObj =
    CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const ActiveIcon = activeCategoryObj.icon;

  const filteredFeatures = useMemo(() => {
    return MASTER_FEATURES.filter((f) => {
      const matchesCategory = f.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const renderValue = (val: string | boolean, plan: 'free' | 'pro' | 'plus' | 'ultra') => {
    if (typeof val === 'boolean') {
      if (val) {
        return (
          <div className="flex items-center justify-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                plan === 'ultra'
                  ? 'bg-purple-100 text-purple-900 ring-1 ring-purple-300'
                  : plan === 'plus'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center text-slate-300">
          <X className="w-4 h-4 stroke-[2]" />
        </div>
      );
    }

    return (
      <span
        className={`text-[12px] font-semibold font-mono ${
          plan === 'ultra'
            ? 'text-purple-950 font-bold'
            : plan === 'plus'
            ? 'text-blue-950'
            : plan === 'pro'
            ? 'text-emerald-950'
            : 'text-slate-800'
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Competitive Benchmark Callout against Bitly & TinyURL */}
      <div className="rounded-3xl border border-[#11140F]/15 bg-gradient-to-br from-[#11140F] via-[#1A2216] to-[#0D150B] p-6 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Competitive Intelligence
          </div>
          <span className="text-[12px] text-white/50 font-mono">102 Distinct Features Across 8 Dedicated Domains</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Why DynamicQR defeats legacy shorteners like Bitly and TinyURL.
          </h3>
          <p className="text-[13.5px] text-white/70 max-w-3xl leading-relaxed">
            Legacy tools like Bitly charge <strong>$35/month</strong> just to connect 1 custom domain, and TinyURL lacks dynamic AI routing and print-ready physical kits. DynamicQR gives you <strong>Autonomous Ingress time & day scheduling</strong>, <strong>Prompt-to-Page AI mobile showcases</strong>, and <strong>sub-15ms edge routing</strong> starting at just $5/month.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-white/50 font-mono">Bitly Growth ($35/mo)</span>
            <p className="text-[12.5px] text-white/85 font-medium">10 custom links/mo &middot; No scheduled time routing &middot; Basic PNGs</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-white/50 font-mono">TinyURL Pro ($12.99/mo)</span>
            <p className="text-[12.5px] text-white/85 font-medium">Static redirect only &middot; No mobile landing pages &middot; No AI art</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-1 ring-1 ring-emerald-500/30">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-mono font-bold">DynamicQR Pro ($5/mo)</span>
            <p className="text-[12.5px] text-white font-medium">Autonomous Ingress &middot; 50 links &middot; 300 DPI kits &middot; Fast Edge</p>
          </div>
        </div>
      </div>

      {/* Interactive Controls: Category Filter Tabs & Focused Search */}
      <div className="space-y-4">
        {/* Category Pills (Tabs Only, No All-102 View) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#11140F] text-white shadow-xs font-semibold ring-2 ring-[#11140F]/15'
                    : 'bg-white text-[#11140F]/70 border border-[#11140F]/10 hover:border-[#11140F]/30 hover:bg-[#EEF0EA]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Description Banner + Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#11140F]/10 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[13.5px] font-bold text-[#11140F]">
                {activeCategoryObj.label}
              </h4>
              <p className="text-[11.5px] text-[#11140F]/55">
                Click any domain tab above to inspect capabilities without page overload.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box inside Active Category */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#11140F]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter this category..."
                className="w-full rounded-xl border border-[#11140F]/15 bg-[#F7F8F5] pl-9 pr-3 py-1.5 text-[12.5px] text-[#11140F] placeholder:text-[#11140F]/40 outline-none focus:border-[#11140F] focus:bg-white transition-all"
              />
            </div>

            <div className="text-[11.5px] font-mono text-[#11140F]/60 whitespace-nowrap shrink-0">
              <strong>{filteredFeatures.length}</strong> features
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Matrix Table for Active Category */}
      <div className="rounded-3xl border border-[#11140F]/15 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#11140F]/10 bg-[#F7F8F5] sticky top-16 z-20">
                <th className="py-3.5 px-5 text-[12.5px] font-bold text-[#11140F] uppercase tracking-wider min-w-[280px]">
                  Feature & Capability
                </th>
                <th className="py-3.5 px-4 text-center text-[12.5px] font-bold text-[#11140F] uppercase tracking-wider w-28">
                  Free
                  <span className="block text-[11px] font-normal text-[#11140F]/50 font-mono lowercase">$0</span>
                </th>
                <th className="py-3.5 px-4 text-center text-[12.5px] font-bold text-[#2F6B4F] uppercase tracking-wider w-36 bg-[#2F6B4F]/5">
                  Pro
                  <span className="block text-[11px] font-normal text-[#2F6B4F]/70 font-mono lowercase">$5/mo</span>
                </th>
                <th className="py-3.5 px-4 text-center text-[12.5px] font-bold text-blue-900 uppercase tracking-wider w-36 bg-blue-50/50">
                  Plus
                  <span className="block text-[11px] font-normal text-blue-800/70 font-mono lowercase">$12/mo</span>
                </th>
                <th className="py-3.5 px-4 text-center text-[12.5px] font-bold text-purple-900 uppercase tracking-wider w-40 bg-purple-50/50">
                  Ultra
                  <span className="block text-[11px] font-normal text-purple-800/70 font-mono lowercase">$29/mo &middot; all</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11140F]/8 text-[13px]">
              {filteredFeatures.map((f, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[#11140F]/[0.015] transition-colors ${
                    f.isBespoke ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#11140F]">{f.name}</span>
                      {f.isBespoke && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-900 uppercase">
                          Bespoke
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#11140F]/55 mt-0.5 max-w-xl">
                      {f.description}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">{renderValue(f.free, 'free')}</td>
                  <td className="py-3 px-4 text-center bg-[#2F6B4F]/[0.02]">
                    {renderValue(f.pro, 'pro')}
                  </td>
                  <td className="py-3 px-4 text-center bg-blue-50/[0.15]">
                    {renderValue(f.plus, 'plus')}
                  </td>
                  <td className="py-3 px-4 text-center bg-purple-50/[0.15]">
                    {renderValue(f.ultra, 'ultra')}
                  </td>
                </tr>
              ))}

              {filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#11140F]/45 text-[13px]">
                    No capabilities found in this category matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
