import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

export const MAX_FULL_BYTES = 3_000_000;
export const MAX_THUMB_BYTES = 600_000;
export const MAX_FOTOS_TOTAL = 400;
export const MAX_POR_TIRA = 24;

let s3Instance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3Instance) {
    s3Instance = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return s3Instance;
}

export async function presignPut({
  key,
  contentType,
  contentLength,
}: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  return getSignedUrl(client, command, {
    expiresIn: 300,
    signableHeaders: new Set(['content-type', 'content-length']),
  });
}

export async function presignGet(key: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  // Redondear signingDate hacia abajo a la hora en punto para estabilizar la URL (permite caché de navegador)
  const nowMs = Date.now();
  const signingDate = new Date(Math.floor(nowMs / 3600000) * 3600000);

  return getSignedUrl(client, command, {
    expiresIn: 7200,
    signingDate,
  });
}

export async function headObject(
  key: string
): Promise<{ size: number; contentType: string } | null> {
  const client = getR2Client();
  try {
    const res = await client.send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
      })
    );
    return {
      size: res.ContentLength ?? 0,
      contentType: res.ContentType ?? '',
    };
  } catch {
    return null;
  }
}

export async function primerosBytes(
  key: string,
  n: number = 12
): Promise<Uint8Array> {
  const client = getR2Client();
  const res = await client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Range: `bytes=0-${n - 1}`,
    })
  );

  if (!res.Body) {
    throw new Error('Cuerpo vacío al leer primeros bytes');
  }

  return res.Body.transformToByteArray();
}

export async function borrarObjetos(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = getR2Client();

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    try {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: env.R2_BUCKET,
          Delete: {
            Objects: batch.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      );
    } catch (err) {
      console.error('Error al borrar objetos de R2:', err);
    }
  }
}

export function firmaValida(
  bytes: Uint8Array,
  formato: 'webp' | 'jpeg'
): boolean {
  if (formato === 'webp') {
    if (bytes.length < 12) return false;
    const riff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46; // 'RIFF'
    const webp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50; // 'WEBP'
    return riff && webp;
  }

  if (formato === 'jpeg') {
    if (bytes.length < 3) return false;
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; // FF D8 FF
  }

  return false;
}
