import { redirect } from 'next/navigation';
import {
  IconPhoto,
  IconArticle,
  IconLayout,
  IconPhotoPlus,
  IconUserHeart,
  IconSpeakerphone,
  IconShoppingCart,
} from '@tabler/icons-react';
import { auth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';
import { StatCard } from '@/app/components/admin/dashboard/StatCard';
import { RecentLeadsTable } from '@/app/components/admin/dashboard/RecentLeadsTable';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const permissions = (await getUserPermissions(session.user.id)) ?? {};
  const canView = (menuCode: string) => permissions[menuCode]?.canView === true;

  const canBanners = canView('BANNERS');
  const canProducts = canView('PRODUCTS');
  const canPromos = canView('PROMOS');
  const canArticles = canView('ARTICLES');
  const canPages = canView('PAGES');
  const canMedia = canView('MEDIA');
  const canLeads = canView('LEADS');

  const [
    activeBanners,
    totalBanners,
    totalProducts,
    totalPromos,
    publishedArticles,
    totalArticles,
    totalPages,
    totalMedia,
    totalLeads,
    recentLeads,
  ] = await Promise.all([
    canBanners ? prisma.banner.count({ where: { isActive: true } }) : Promise.resolve(0),
    canBanners ? prisma.banner.count() : Promise.resolve(0),
    canProducts ? prisma.product.count() : Promise.resolve(0),
    canPromos ? prisma.promo.count() : Promise.resolve(0),
    canArticles
      ? prisma.article.count({ where: { isPublished: true } })
      : Promise.resolve(0),
    canArticles ? prisma.article.count() : Promise.resolve(0),
    canPages ? prisma.staticPage.count() : Promise.resolve(0),
    canMedia ? prisma.media.count() : Promise.resolve(0),
    canLeads ? prisma.lead.count() : Promise.resolve(0),
    canLeads
      ? prisma.lead.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const showContent =
    canBanners || canProducts || canPromos || canArticles || canPages;
  const showMediaLeads = canMedia || canLeads;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ringkasan data esensial CMS dan leads simulasi kredit
        </p>
      </div>

      {showContent && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Konten
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {canBanners && (
              <StatCard
                label="Banner Aktif"
                value={activeBanners}
                sublabel={`dari ${totalBanners} total`}
                href="/admin/banners"
                icon={IconPhoto}
                accent="primary"
              />
            )}
            {canProducts && (
              <StatCard
                label="Produk"
                value={totalProducts}
                href="/admin/products"
                icon={IconShoppingCart}
                accent="default"
              />
            )}
            {canPromos && (
              <StatCard
                label="Promo"
                value={totalPromos}
                href="/admin/promos"
                icon={IconSpeakerphone}
                accent="default"
              />
            )}
            {canArticles && (
              <StatCard
                label="Artikel Publikasi"
                value={publishedArticles}
                sublabel={`dari ${totalArticles} total`}
                href="/admin/articles"
                icon={IconArticle}
                accent="success"
              />
            )}
            {canPages && (
              <StatCard
                label="Halaman Statis"
                value={totalPages}
                href="/admin/pages"
                icon={IconLayout}
                accent="default"
              />
            )}
          </div>
        </section>
      )}

      {showMediaLeads && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Media & Leads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canMedia && (
              <StatCard
                label="File Media"
                value={totalMedia}
                href="/admin/media"
                icon={IconPhotoPlus}
                accent="default"
              />
            )}
            {canLeads && (
              <StatCard
                label="Total Leads"
                value={totalLeads}
                href="/admin/leads"
                icon={IconUserHeart}
                accent="warning"
              />
            )}
          </div>
        </section>
      )}

      {canLeads && (
        <section>
          <RecentLeadsTable leads={recentLeads} />
        </section>
      )}
    </div>
  );
}
