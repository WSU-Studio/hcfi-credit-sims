'use client';

import { useState } from 'react';
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { IconUpload, IconX } from '@tabler/icons-react';

export function MediaLibrary() {
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);

  const handleUpload = (result: any) => {
    if (result?.info) {
      // Save to database
      fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: result.info.original_filename,
          url: result.info.secure_url,
          cloudinaryId: result.info.public_id,
          mimeType: result.info.format,
          size: result.info.bytes,
          width: result.info.width,
          height: result.info.height,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setUploadedImages((prev) => [data.media, ...prev]);
        });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <CldUploadButton
          uploadPreset="hcfi_media"
          onUpload={handleUpload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconUpload size={20} />
          Upload Media
        </CldUploadButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {uploadedImages.map((image) => (
          <div key={image.id} className="relative group">
            <CldImage
              src={image.cloudinaryId}
              width={200}
              height={200}
              alt={image.filename}
              className="rounded-lg object-cover w-full h-32"
            />
            <button
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                // Handle delete
              }}
            >
              <IconX size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


