import React from 'react';
import { prisma } from '@/lib/prisma';
import { migrateV2 } from '@/lib/builder/migrate-v2';
import { BuilderShell } from '@/components/builder/BuilderShell';
import { Page } from '@/lib/page/schema';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface BuilderPageProps {
  params: {
    pageId: string;
  };
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { pageId } = params;

  let landingPage: any = null;
  let destinationUrl = 'https://dynamicqr.io';

  if (pageId !== 'demo') {
    try {
      landingPage = await prisma.landingPage.findFirst({
        where: {
          OR: [
            { id: pageId },
            { qrLinkId: pageId },
            { qrLink: { shortCode: pageId } },
          ],
        },
        include: { qrLink: true },
      });
      if (landingPage?.qrLink?.destinationUrl) {
        destinationUrl = landingPage.qrLink.destinationUrl;
      } else {
        const link = await prisma.qrLink.findFirst({
          where: {
            OR: [{ id: pageId }, { shortCode: pageId }],
          },
        });
        if (link?.destinationUrl) {
          destinationUrl = link.destinationUrl;
        }
      }
    } catch (err) {
      console.warn('Builder DB lookup fallback to demo:', err);
    }
  }

  // Construct initial V2 page representation or preserve existing V3 document
  const rawSpec = landingPage?.spec as any;
  let initialDoc: any = null;

  if (rawSpec && rawSpec.schemaVersion === 3 && rawSpec.nodes) {
    initialDoc = rawSpec;
  } else {
    const initialV2Page: Page = rawSpec && typeof rawSpec === 'object' && rawSpec.brand
      ? (rawSpec as Page)
      : {
          schemaVersion: 1,
          template: 'creator',
          brand: {
            name: 'Yemuel Creative Studio',
            headline: 'Architecting Digital Identity',
            tagline: 'Precision engineered web experiences and interactive systems for modern businesses.',
            palette: 'ink',
          },
          cta: {
            label: 'Explore Our Work',
            url: destinationUrl,
          },
          links: [
            { label: 'Client Portfolio & Case Studies', url: 'https://github.com' },
            { label: 'Schedule an Architecture Consultation', url: 'https://cal.com' },
          ],
          services: [
            { name: 'Core Design Engine', price: '₦150,000', desc: 'Full custom design tokens and interactive prototypes.' },
            { name: 'Cloud Infrastructure', price: '₦220,000', desc: 'Edge routing, multi-domain SSL, and sub-50ms latency.' },
            { name: 'Physical Print Suite', price: '₦45,000', desc: '300 DPI vector poster and table tent print generation.' },
          ],
          contact: {
            phone: '+234 801 234 5678',
            email: 'founder@yemuel.io',
            whatsapp: '2348012345678',
            instagram: '@yemuel',
            address: '14 Victoria Island, Lagos',
          },
        };

    initialDoc = migrateV2(initialV2Page, destinationUrl);
  }

  const handleSave = async (doc: any) => {
    'use server';
    if (pageId && pageId !== 'demo') {
      try {
        const existing = await prisma.landingPage.findFirst({
          where: {
            OR: [
              { id: pageId },
              { qrLinkId: pageId },
              { qrLink: { shortCode: pageId } },
            ],
          },
        });

        if (existing) {
          await prisma.landingPage.update({
            where: { id: existing.id },
            data: {
              spec: doc as any,
              published: true,
            },
          });
          await prisma.qrLink.update({
            where: { id: existing.qrLinkId },
            data: { type: 'landing-page' },
          });
        } else {
          const link = await prisma.qrLink.findFirst({
            where: {
              OR: [{ id: pageId }, { shortCode: pageId }],
            },
          });
          if (link) {
            await prisma.landingPage.create({
              data: {
                qrLinkId: link.id,
                spec: doc as any,
                published: true,
              },
            });
            await prisma.qrLink.update({
              where: { id: link.id },
              data: { type: 'landing-page' },
            });
          }
        }
      } catch (err) {
        console.error('Failed to save builder doc:', err);
      }
    }
  };

  return (
    <BuilderShell
      initialDoc={initialDoc}
      pageId={pageId}
      onSave={handleSave}
    />
  );
}
