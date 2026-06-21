'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

type DealerLinkProps = ComponentProps<typeof Link>;

export function DealerLink({ href, className, ...props }: DealerLinkProps) {
  return <Link href={href} className={className} {...props} />;
}
