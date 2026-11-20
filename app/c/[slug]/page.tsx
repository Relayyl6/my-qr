import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  UserPlus,
  Share2,
  MapPin,
  ExternalLink,
  Linkedin,
  Twitter,
  Instagram,
  QrCode,
} from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'vcard') {
    return { title: 'Contact Not Found | DynamicQR' };
  }

  return {
    title: `${item.title} — Digital Contact Card`,
    description: `Connect with ${item.title}. Save directly to your phone contacts.`,
  };
}

export default async function VCardPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'vcard') {
    notFound();
  }

  // Increment scans/views count asynchronously
  prisma.microSaasItem
    .update({
      where: { id: item.id },
      data: { scansCount: { increment: 1 } },
    })
    .catch(() => {});

  const spec = (item.spec as any) || {};
  const fullName = item.title;
  const firstName = spec.firstName || '';
  const title = spec.title || '';
  const company = spec.company || '';
  const phone = spec.phone || '';
  const email = spec.email || '';
  const website = spec.website || '';
  const bio = spec.bio || '';
  const linkedin = spec.linkedin || '';
  const twitter = spec.twitter || '';
  const instagram = spec.instagram || '';
  const showBranding = spec.showBranding !== false;

  const initials = `${firstName ? firstName[0] : ''}${spec.lastName ? spec.lastName[0] : ''}`.toUpperCase() || 'QR';

  return (
    <div className="min-h-screen bg-[#F0F2EB] text-[#11140F] flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-[#2F6B4F] selection:text-white">
      <div className="w-full max-w-md my-auto space-y-6">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-[#11140F]/10 p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#2F6B4F] to-[#11140F]" />

          {/* Profile Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#11140F] text-[#EEF0EA] flex items-center justify-center text-2xl sm:text-3xl font-bold tracking-wider shadow-md border-4 border-white">
              {initials}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#11140F] tracking-tight">
                {fullName}
              </h1>
              {title && (
                <p className="text-sm font-medium text-[#2F6B4F] mt-0.5">
                  {title}
                </p>
              )}
              {company && (
                <p className="text-xs font-semibold text-[#11140F]/60 uppercase tracking-wider mt-0.5">
                  {company}
                </p>
              )}
            </div>

            {bio && (
              <p className="text-xs sm:text-[13px] text-[#11140F]/70 leading-relaxed max-w-xs mx-auto pt-1">
                {bio}
              </p>
            )}
          </div>

          {/* Primary Action: Save to Phone Contacts */}
          <div className="pt-2">
            <a
              href={`/api/vcard/${slug}/download`}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#11140F] text-white text-sm font-bold hover:bg-[#2A2E25] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#34D399]" />
              <span>Save Contact to Phone</span>
            </a>
          </div>

          {/* Quick Connect Actions */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-3 rounded-2xl bg-[#F7F8F5] border border-[#11140F]/8 hover:border-[#11140F]/20 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#11140F]/10 mx-auto flex items-center justify-center text-[#11140F] group-hover:bg-[#2F6B4F] group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#11140F]/80 block mt-1.5">
                  Call
                </span>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="p-3 rounded-2xl bg-[#F7F8F5] border border-[#11140F]/8 hover:border-[#11140F]/20 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#11140F]/10 mx-auto flex items-center justify-center text-[#11140F] group-hover:bg-[#2F6B4F] group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#11140F]/80 block mt-1.5">
                  Email
                </span>
              </a>
            )}

            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-[#F7F8F5] border border-[#11140F]/8 hover:border-[#11140F]/20 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#11140F]/10 mx-auto flex items-center justify-center text-[#11140F] group-hover:bg-[#2F6B4F] group-hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#11140F]/80 block mt-1.5">
                  Website
                </span>
              </a>
            )}
          </div>

          {/* Details & Socials */}
          <div className="space-y-3 pt-2 border-t border-[#11140F]/8 text-xs">
            {phone && (
              <div className="flex items-center justify-between text-[#11140F]/80 py-1">
                <span className="text-[#11140F]/50">Mobile</span>
                <span className="font-mono font-medium">{phone}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center justify-between text-[#11140F]/80 py-1">
                <span className="text-[#11140F]/50">Email</span>
                <span className="font-medium truncate max-w-[220px]">{email}</span>
              </div>
            )}

            {/* Social Icons */}
            {(linkedin || twitter || instagram) && (
              <div className="pt-3 flex items-center justify-center gap-3">
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-[#F7F8F5] border border-[#11140F]/10 flex items-center justify-center text-[#11140F] hover:bg-[#2F6B4F] hover:text-white transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {twitter && (
                  <a
                    href={twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-[#F7F8F5] border border-[#11140F]/10 flex items-center justify-center text-[#11140F] hover:bg-[#2F6B4F] hover:text-white transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-[#F7F8F5] border border-[#11140F]/10 flex items-center justify-center text-[#11140F] hover:bg-[#2F6B4F] hover:text-white transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Powered by DynamicQR Footer Badge */}
        {showBranding && (
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#11140F]/8 text-[11px] text-[#11140F]/60 hover:text-[#11140F] transition-colors"
            >
              <span>Powered by</span>
              <strong className="text-[#11140F]">DynamicQR</strong>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
