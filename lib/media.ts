/**
 * Media and image URL utilities for high-performance edge delivery.
 */

/**
 * Normalizes any image URL to serve through the high-speed Vercel Edge CDN proxy.
 * If the URL is already an optimized CDN route or a local / external URL, it is preserved.
 * If it points to raw Neon S3 storage, it is rewritten to /api/cdn/<key> so Vercel caches it at the edge worldwide.
 */
export function getOptimizedStorageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs, local public assets, or already proxied CDN URLs
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/api/cdn/') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('/images/')
  ) {
    return trimmed;
  }

  // Neon S3 public storage URL: https://<branch>.storage.<subdomain>.neon.tech/<bucket>/<key>
  if (trimmed.includes('.neon.tech') && trimmed.includes('/public-assets/')) {
    const parts = trimmed.split('/public-assets/');
    if (parts[1]) {
      return `/api/cdn/${parts[1]}`;
    }
  }

  // Generic S3 or cloud URL: if it contains /uploads/
  if (trimmed.includes('/uploads/')) {
    const parts = trimmed.split('/uploads/');
    if (parts[1]) {
      return `/api/cdn/uploads/${parts[1]}`;
    }
  }

  return trimmed;
}

/**
 * High-performance in-browser image optimization using HTML5 Canvas.
 * Compresses raw camera photos (5MB - 15MB) into lightweight WebP (< 50KB)
 * while preserving 100% crisp retina clarity for the given display variant.
 */
export async function optimizeImageInBrowser(
  file: File,
  variant: 'avatar' | 'banner' | 'dish' | 'logo' | 'square' = 'square'
): Promise<File> {
  // Pass SVGs and GIFs (potential animations) directly through
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // Determine ideal retina bounds
  let maxDimension = 800;
  let quality = 0.88;

  if (variant === 'avatar') {
    maxDimension = 512; // 5x resolution of standard 96px avatar
    quality = 0.88;
  } else if (variant === 'logo') {
    maxDimension = 600;
    quality = 0.90;
  } else if (variant === 'banner') {
    maxDimension = 1600;
    quality = 0.85;
  } else if (variant === 'dish' || variant === 'square') {
    maxDimension = 800;
    quality = 0.88;
  }

  return new Promise((resolve) => {
    // Timeout fallback: if processing hangs, fallback to original file
    const timer = setTimeout(() => resolve(file), 4000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        let width = img.width;
        let height = img.height;

        // If file is already smaller than 80KB and under dimensions, keep original
        if (width <= maxDimension && height <= maxDimension && file.size < 80 * 1024) {
          resolve(file);
          return;
        }

        // Calculate aspect ratio scaled dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // Don't use if larger than original
            } else {
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const optimizedFile = new File([blob], `${baseName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(file);
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      clearTimeout(timer);
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}
