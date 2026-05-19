'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { uploadToUploadThing, UploadEndpoint } from '@/lib/uploadthing';
import s from './FileUpload.module.scss';

interface FileUploadProps {
  endpoint: UploadEndpoint;
  productId?: string;
  multiple?: boolean;
  label?: string;
  onUploaded: (urls: string[]) => void;
}

export default function FileUpload({ endpoint, productId, multiple = false, label = 'Upload file', onUploaded }: FileUploadProps) {
  const { token } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    setError('');
    if (!token) {
      setError('You must be logged in to upload files.');
      return;
    }
    if (files.length === 0) {
      setError('Choose at least one file first.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadToUploadThing(endpoint, files, token, productId);
      const urls = result
        .map((file: any) => file.url ?? file.ufsUrl ?? file.appUrl)
        .filter(Boolean);
      onUploaded(urls);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <input
        ref={inputRef}
        className={s.input}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(event) => setFiles(Array.from(event.target.files || []))}
      />

      <div className={s.actions}>
        <button className={s.button} type="button" disabled={uploading || files.length === 0} onClick={handleUpload}>
          {uploading ? 'Uploading…' : label}
        </button>
        {files.length > 0 && !uploading && (
          <span className={s.hint}>{files.length} file{files.length > 1 ? 's' : ''} selected</span>
        )}
      </div>

      {error && <div className={s.error}>{error}</div>}
    </div>
  );
}
