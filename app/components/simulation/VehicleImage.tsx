'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { IconPhoto } from '@tabler/icons-react';

type VehicleImageProps = {
  assetCode?: string;
  fullAssetCode?: string;
  assetName?: string;
  className?: string;
};

export function VehicleImage({ assetCode, fullAssetCode, assetName, className = '' }: VehicleImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (assetCode) params.set('assetCode', assetCode);
    if (fullAssetCode) params.set('fullAssetCode', fullAssetCode);
    if (assetName) params.set('assetName', assetName);
    return params.toString();
  }, [assetCode, fullAssetCode, assetName]);

  useEffect(() => {
    let active = true;
    if (!queryString) return;

    fetch(`/api/simulation/vehicle-image?${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setImageUrl(data.imageUrl || null);
      })
      .catch(() => {
        if (!active) return;
        setImageUrl(null);
      });

    return () => {
      active = false;
    };
  }, [queryString]);

  return (
    <div className={`aspect-[4/3] rounded-lg bg-gray-200 flex items-center justify-center mb-2 overflow-hidden ${className}`}>
      {imageUrl ? (
        <div className="relative h-full w-full">
          <Image
            src={imageUrl}
            alt={assetName ? `Gambar ${assetName}` : 'Gambar kendaraan'}
            fill
            className="object-contain bg-gray-100"
            sizes="(max-width: 1024px) 100vw, 320px"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <IconPhoto size={40} stroke={1.5} />
          <span className="text-xs">Gambar kendaraan</span>
        </div>
      )}
    </div>
  );
}
