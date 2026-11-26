import { notFound } from "next/navigation";
import { getLandingPageByShortCode } from "@/lib/ai/features/landing-page-builder";
import { RenderPage } from "@/lib/page/render";
import { RenderDoc } from "@/lib/builder/render";
import { migrateLegacySpec } from "@/lib/page/migrate";
import { PALETTES, PaletteKey } from "@/lib/page/config";
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

  const page = migrateLegacySpec(result.spec, result.link.destinationUrl);
  const pageTitle = `${page.brand.name} | DynamicQR`;
  const pageDesc =
    page.brand.tagline || page.brand.headline || "Official mobile destination powered by DynamicQR.";
  const canonicalUrl = `${APP_URL}/page/${params.shortCode}`;
  const rawImage = page.brand.logoUrl;
  const ogImageUrl = rawImage ? getOptimizedStorageUrl(rawImage) : `${APP_URL}/icon.svg`;
  const palette = PALETTES[page.brand.palette as PaletteKey] || PALETTES.ink;

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
          alt: `${page.brand.name} Mobile Page`,
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
      "theme-color": palette.accent,
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

  // If published doc is V3 Normalized Tree
  const rawSpec = result.spec as any;
  if (rawSpec && rawSpec.schemaVersion === 3 && rawSpec.nodes) {
    const bg = rawSpec.tokens?.colors?.bg || '#0F172A';
    return (
      <div
        className="min-h-screen w-full"
        style={{ backgroundColor: bg }}
      >
        <RenderDoc doc={rawSpec} pageId={result.landingPage.id} mode="published" />
      </div>
    );
  }

  const page = migrateLegacySpec(result.spec, result.link.destinationUrl);
  const palette = PALETTES[page.brand.palette as PaletteKey] || PALETTES.ink;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4"
      style={{ backgroundColor: palette.bg }}
    >
      <div className="w-full max-w-[480px] mx-auto" style={{ maxWidth: '480px' }}>
        <RenderPage
          page={page}
          pageId={result.landingPage.id}
        />
      </div>
    </div>
  );
}
