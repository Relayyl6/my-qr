import { notFound } from "next/navigation";
import { getLandingPageByShortCode } from "@/lib/ai/features/landing-page-builder";
import { RenderLandingPage } from "@/lib/landing/render";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { shortCode: string };
}): Promise<Metadata> {
  const result = await getLandingPageByShortCode(params.shortCode);
  if (!result) return { title: "Page Not Found — DynamicQR" };

  return {
    title: `${result.spec.businessName} — DynamicQR`,
    description: result.spec.bio || "Official mobile destination",
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

  return <RenderLandingPage spec={result.spec} />;
}
