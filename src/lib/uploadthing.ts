'use client';

import { genUploader } from 'uploadthing/client';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const uploadthingUrl = `${apiBase.replace(/\/api\/?$/, '')}/api/uploadthing`;

export type UploadEndpoint = 'userAvatar' | 'brandLogo' | 'productImages';

export async function uploadToUploadThing(
  endpoint: UploadEndpoint,
  files: File[],
  token: string,
  productId?: string
) {
  const uploadFiles = genUploader<any>({
    url: uploadthingUrl,
    package: 'brandhub-frontend',
  });

  return uploadFiles(endpoint as never, {
    files,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(productId ? { 'x-product-id': productId } : {}),
    },
  });
}
