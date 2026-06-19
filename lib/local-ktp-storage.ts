import fs from 'fs/promises';
import path from 'path';
import { isLeadKtpS3Key } from '@/lib/s3-url';

const DATA_ROOT = path.join(process.cwd(), '.data');

function assertSafeKtpKey(key: string): void {
  if (!isLeadKtpS3Key(key)) {
    throw new Error('Invalid KTP storage key');
  }
}

export function getLocalKtpAbsolutePath(key: string): string {
  assertSafeKtpKey(key);
  const abs = path.resolve(DATA_ROOT, key);
  const root = path.resolve(DATA_ROOT);
  if (!abs.startsWith(`${root}${path.sep}`) && abs !== root) {
    throw new Error('Invalid KTP storage path');
  }
  return abs;
}

export async function saveLocalKtpFile(key: string, buffer: Buffer): Promise<void> {
  const filePath = getLocalKtpAbsolutePath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}

export async function readLocalKtpFile(key: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const filePath = getLocalKtpAbsolutePath(key);
  const buffer = await fs.readFile(filePath);
  return { buffer, contentType: 'image/webp' };
}
