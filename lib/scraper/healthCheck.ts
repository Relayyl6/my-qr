export interface HealthCheckResult {
  isHealthy: boolean;
  warnings: string[];
  statusCode?: number;
  isHttps: boolean;
  redirectCount: number;
}

export async function healthCheck(url: string): Promise<HealthCheckResult> {
  const warnings: string[] = [];
  let isHttps = false;
  let statusCode: number | undefined;
  let redirectCount = 0;

  try {
    const parsed = new URL(url);
    isHttps = parsed.protocol === "https:";

    if (!isHttps) {
      warnings.push("URL uses insecure HTTP instead of HTTPS.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DynamicQR-HealthCheck/1.0)",
      },
    });

    clearTimeout(timeout);
    statusCode = response.status;

    if (response.status >= 400) {
      warnings.push(`Target page returned HTTP ${response.status} (${response.statusText || "Error"}).`);
    }

    if (response.redirected) {
      redirectCount = 1;
      warnings.push(`URL automatically redirects to: ${response.url}`);
    }

    const html = await response.text();
    if (html.toLowerCase().includes('content="noindex') || html.toLowerCase().includes("content='noindex")) {
      warnings.push("Page contains 'noindex' robot directive.");
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      warnings.push("Health check timed out after 3.5s. Page might be slow or unresponsive.");
    } else {
      warnings.push(`Could not connect to URL: ${error.message || "Network unreachable"}`);
    }
  }

  return {
    isHealthy: warnings.length === 0,
    warnings,
    statusCode,
    isHttps,
    redirectCount,
  };
}
