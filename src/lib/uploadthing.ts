'use client';

import { genUploader } from 'uploadthing/client';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const uploadthingUrl = `${apiBase.replace(/\/api\/?$/, '')}/api/uploadthing`;

const { uploadFiles } = genUploader<any>({
  url: uploadthingUrl,
  package: 'brandhub-frontend',
});

export type UploadEndpoint = 'userAvatar' | 'brandLogo' | 'productImages';

export async function uploadToUploadThing(
  endpoint: UploadEndpoint,
  files: File[],
  token: string,
  productId?: string
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (productId) headers['x-product-id'] = productId;

  return uploadFiles(endpoint as never, {
    files,
    headers,
  });
}