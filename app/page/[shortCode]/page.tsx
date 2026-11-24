import { notFound } from "next/navigation";
import { getLandingPageByShortCode } from "@/lib/ai/features/landing-page-builder";
import { RenderLandingPage } from "@/lib/landing/render";
import { Metadata } from "next";
import { APP_URL } from "@/lib/config";
import { getOptimizedStorageUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { shortCode: string };
}): Promise<Metadata> {
  const result = await getLandingPageByShortCode(params.shortCode);
  if (!result) return { title: "Page Not Found — DynamicQR" };

  const spec = result.spec as any;
  const heroBlock = Array.isArray(spec.blocks) ? spec.blocks.find((b: any) => b.type === 'hero') : null;
  const pageTitle = `${spec.businessName || heroBlock?.title || 'Exclusive Landing Page'} | DynamicQR`;
  const pageDesc = spec.bio || heroBlock?.subtitle || 'Official mobile destination powered by DynamicQR.';
  const canonicalUrl = `${APP_URL}/page/${params.shortCode}`;
  const rawImage = heroBlock?.avatarUrl || spec.heroImageUrl || spec.logoUrl;
  const ogImageUrl = rawImage ? getOptimizedStorageUrl(rawImage) : `${APP_URL}/icon.svg`;

  return {
    metadataBase: new URL(APP_URL),
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      siteName: "DynamicQR",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${spec.businessName} Mobile Page`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [ogImageUrl],
    },
    other: {
      "theme-color": spec.theme?.accentColor || spec.themeColor || "#10B981",
    },
  };
}

export default async function LandingViewPage({
  params,
}: {
  params: { shortCode: string };
}) {
  const result = await getLandingPageByShortCode(params.shortCode);

  if (!result || !result.landingPage.published) {
    notFound();
  }

  return (
    <RenderLandingPage
      spec={result.spec}
      destinationUrl={result.link.destinationUrl}
      shortCode={params.shortCode}
    />
  );
}
