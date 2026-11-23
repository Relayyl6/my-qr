import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || 'public-assets';
const ENDPOINT = process.env.AWS_ENDPOINT_URL_S3;
const REGION = process.env.AWS_REGION || 'us-east-2';
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

export function getS3Client(): S3Client | null {
  if (!ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    forcePathStyle: true, // required: Neon uses path-style addressing
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadObjectToCloud({
  fileBuffer,
  fileName,
  contentType,
  folder = 'images',
}: {
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<{ url: string; key: string }> {
  const s3 = getS3Client();
  if (!s3) {
    throw new Error('Cloud object storage is not configured. Missing S3 credentials.');
  }

  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueKey = `uploads/${folder}/${Date.now()}-${cleanFileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const publicUrl = `/api/cdn/${uniqueKey}`;
  return { url: publicUrl, key: uniqueKey };
}

export { getOptimizedStorageUrl } from './media';

export async function deleteObjectFromCloud(key: string): Promise<boolean> {
  const s3 = getS3Client();
  if (!s3) return false;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error('[deleteObjectFromCloud error]:', err);
    return false;
  }
}
