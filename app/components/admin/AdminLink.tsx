'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useAdminNavigation } from '@/app/(back-office)/AdminNavigationContext';

type AdminLinkProps = ComponentProps<typeof Link>;

/**
 * Link untuk navigasi di area admin. Saat diklik akan menampilkan
 * indikator loading (progress bar) sampai halaman tujuan selesai load.
 * Gunakan untuk: menu sidebar, tombol Add/Edit, link "Kembali", dll.
 */
export function AdminLink({ onClick, ...props }: AdminLinkProps) {
  const { setNavigating } = useAdminNavigation();

  return (
    <Link
      {...props}
      onClick={(e) => {
        setNavigating(true);
        onClick?.(e);
      }}
    />
  );
}
