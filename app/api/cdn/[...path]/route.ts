import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || 'public-assets';
const ENDPOINT = process.env.AWS_ENDPOINT_URL_S3;

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const rawPath = params.path ? params.path.join('/') : '';
    if (!rawPath) {
      return new NextResponse('Asset path required', { status: 400 });
    }

    // Clean up key path (e.g. remove leading 'public-assets/' if passed)
    const key = rawPath.startsWith(`${BUCKET_NAME}/`)
      ? rawPath.replace(`${BUCKET_NAME}/`, '')
      : rawPath;

    // Fast path: use direct anonymous fetch from Neon S3 endpoint if public
    if (ENDPOINT) {
      try {
        const directUrl = `${ENDPOINT}/${BUCKET_NAME}/${key}`;
        const neonRes = await fetch(directUrl, {
          headers: {
            'User-Agent': 'DynamicQR-CDN/1.0',
          },
          // Cache aggressively on Vercel Edge
          next: { revalidate: 31536000 },
        });

        if (neonRes.ok) {
          const contentType = neonRes.headers.get('content-type') || 'application/octet-stream';
          const arrayBuffer = await neonRes.arrayBuffer();

          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable',
              'CDN-Cache-Control': 'public, max-age=31536000',
              'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch (directErr) {
        console.warn('[CDN Direct Fetch Warning]:', directErr);
      }
    }

    // Fallback: S3 Client Authenticated GetObject
    const s3 = getS3Client();
    if (!s3) {
      return new NextResponse('Storage client not available', { status: 503 });
    }

    const s3Obj = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    if (!s3Obj.Body) {
      return new NextResponse('Asset not found', { status: 404 });
    }

    const contentType = s3Obj.ContentType || 'application/octet-stream';
    const byteArray = await s3Obj.Body.transformToByteArray();

    return new NextResponse(byteArray as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[CDN Route Error]:', err);
    return new NextResponse(err.message || 'Error fetching asset', { status: 500 });
  }
}
