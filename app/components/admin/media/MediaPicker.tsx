'use client';

import { useState, useEffect } from 'react';
import { IconFileMinus } from '@tabler/icons-react';

type Media = {
  id: string;
  filename: string;
  url: string;
  cloudinaryId: string | null;
  width: number | null;
  height: number | null;
};

type MediaPickerProps = {
  onSelect: (media: Media | null) => void;
  currentMediaId?: string | null;
};

export function MediaPicker({ onSelect, currentMediaId }: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(currentMediaId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/media')
      .then((res) => res.json())
      .then((data) => {
        setMedia(data.media || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSelect = (item: Media) => {
    setSelectedId(item.id);
    onSelect(item);
  };

  if (loading) {
    return <div className="text-center py-4">Loading media...</div>;
  }

  return (
    <div>
      <div
        className="relative border-2 border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-500 transition-colors h-10 w-10"
        onClick={() => {
          setSelectedId(null);
          onSelect(null);
        }}
      >
        {/* {selectedId === null && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
            <IconCheck size={16} />
          </div>
        )} */}
        <IconFileMinus size={20} />
        {/* <span className="text-sm text-gray-500">None</span> */}
      </div>
      {/* {media.map((item) => (
        <div
          key={item.id}
          className="relative cursor-pointer group"
          onClick={() => handleSelect(item)}
        >
          {item.cloudinaryId ? (
            <CldImage
              src={item.cloudinaryId}
              width={150}
              height={150}
              alt={item.filename}
              className="rounded-lg object-cover w-full h-24"
            />
          ) : (
            <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">No preview</span>
            </div>
          )}
          {selectedId === item.id && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
              <IconCheck size={16} />
            </div>
          )}
        </div>
      ))} */}
    </div>
  );
}


