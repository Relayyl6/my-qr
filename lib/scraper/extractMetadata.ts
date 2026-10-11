import * as cheerio from "cheerio";

export interface PageMetadata {
  title: string;
  description: string;
  favicon?: string;
  ogImage?: string;
}

export async function extractMetadata(url: string): Promise<PageMetadata> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const parsedUrl = new URL(url);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DynamicQR-Enricher/1.0; +https://dynamicqr.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        title: parsedUrl.hostname,
        description: `Page returned HTTP status ${response.status}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr("content");
    const docTitle = $("title").first().text();
    const title = (ogTitle || docTitle || parsedUrl.hostname).trim();

    const ogDesc = $('meta[property="og:description"]').attr("content");
    const metaDesc = $('meta[name="description"]').attr("content");
    const description = (ogDesc || metaDesc || "").trim();

    const ogImage = $('meta[property="og:image"]').attr("content");

    let favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href");

    if (favicon && !favicon.startsWith("http")) {
      try {
        favicon = new URL(favicon, parsedUrl.origin).toString();
      } catch {
        favicon = undefined;
      }
    }

    return {
      title,
      description,
      favicon: favicon || `${parsedUrl.origin}/favicon.ico`,
      ogImage: ogImage ? (ogImage.startsWith("http") ? ogImage : new URL(ogImage, parsedUrl.origin).toString()) : undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    try {
      const parsedUrl = new URL(url);
      return {
        title: parsedUrl.hostname,
        description: error.name === "AbortError" ? "Page took longer than 3s to respond." : "Unable to reach website.",
      };
    } catch {
      return {
        title: url,
        description: "Invalid URL provided.",
      };
    }
  }
}
