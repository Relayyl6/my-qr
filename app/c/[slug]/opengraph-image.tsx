import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getOptimizedStorageUrl } from '@/lib/media';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved.slug;

  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  const title = item?.title || 'Digital Business Card';
  const spec = (item?.spec as any) || {};
  const jobTitle = spec.title || '';
  const company = spec.company || '';
  const bio = spec.bio || 'Digital contact card, custom links & live networking profile.';
  const rawAvatar = spec.avatarUrl || spec.logoUrl || null;
  const avatarUrl = rawAvatar ? getOptimizedStorageUrl(rawAvatar) : null;
  const accentColor = spec.accentColor || '#10B981';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#090A0E',
          backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18), transparent 45%), radial-gradient(circle at 85% 85%, rgba(59, 130, 246, 0.15), transparent 45%)',
          padding: '60px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#000000',
              }}
            >
              QR
            </div>
            <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              DynamicQR
            </span>
          </div>

          <div
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#34D399',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span>Digital vCard 3.0</span>
          </div>
        </div>

        {/* Center Profile Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', margin: 'auto 0' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '36px',
                objectFit: 'cover',
                border: `3px solid ${accentColor}`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            />
          ) : (
            <div
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '36px',
                backgroundColor: '#161922',
                border: `3px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                fontWeight: 'bold',
                color: accentColor,
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              }}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              {title}
            </h1>
            {(jobTitle || company) && (
              <p style={{ fontSize: '24px', color: '#34D399', fontWeight: 600, margin: '10px 0 0 0' }}>
                {jobTitle}{jobTitle && company ? ' • ' : ''}{company}
              </p>
            )}
            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.65)',
                margin: '12px 0 0 0',
                maxWidth: '750px',
                lineHeight: 1.4,
              }}
            >
              {bio}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px',
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <span>Tap to save contact, view links, or connect</span>
          <span style={{ fontFamily: 'monospace', color: accentColor, fontWeight: 'bold' }}>
            dynamicqr.com/c/{slug}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
