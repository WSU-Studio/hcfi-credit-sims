import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Providers } from '../providers';
import { requireDealerPortalSession } from '@/lib/dealer-auth-server';
import { DealerSidebar } from '@/app/components/dealer/DealerSidebar';
import { DealerTopbar } from '@/app/components/dealer/DealerTopbar';
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
        <div className="flex min-h-screen bg-gray-50 text-gray-900">
          <DealerSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DealerTopbar />
            <main className="flex-1 p-6 min-w-0">{children}</main>
          </div>
        </div>
      </NextIntlClientProvider>
    </Providers>
  );
}
