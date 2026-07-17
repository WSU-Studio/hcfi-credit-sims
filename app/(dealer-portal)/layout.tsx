import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Providers } from '../providers';
import { requireDealerPortalSession } from '@/lib/dealer-auth-server';
import { DealerPortalShell } from '@/app/components/dealer/DealerPortalShell';
import idMessages from '@/messages/id.json';

export const metadata: Metadata = {
  title: 'Dealer Portal - Hyundai Capital',
  description: 'Portal dealer dan sales Hyundai Capital Finance Indonesia',
};

export default async function DealerPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireDealerPortalSession();

  return (
    <Providers>
      <NextIntlClientProvider locale="id" messages={idMessages}>
        <DealerPortalShell>{children}</DealerPortalShell>
      </NextIntlClientProvider>
    </Providers>
  );
}
