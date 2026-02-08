import { redirect } from 'next/navigation';
import {
  IconUsers,
  IconShield,
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
import { StatCard } from '@/app/components/admin/dashboard/StatCard';
import { RecentLeadsTable } from '@/app/components/admin/dashboard/RecentLeadsTable';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const [
    totalUsers,
    totalRoles,
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
    prisma.user.count(),
    prisma.role.count(),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.banner.count(),
    prisma.product.count(),
    prisma.promo.count(),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.article.count(),
    prisma.staticPage.count(),
    prisma.media.count(),
    prisma.lead.count(),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ringkasan data esensial CMS dan leads simulasi kredit
        </p>
      </div>

      {/* Users & Access */}
      {/* <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Pengguna & Akses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Pengguna"
            value={totalUsers}
            href="/admin/users"
            icon={IconUsers}
            accent="primary"
          />
          <StatCard
            label="Role"
            value={totalRoles}
            href="/admin/roles"
            icon={IconShield}
            accent="default"
          />
        </div>
      </section> */}

      {/* Content */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Konten
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Banner Aktif"
            value={activeBanners}
            sublabel={`dari ${totalBanners} total`}
            href="/admin/banners"
            icon={IconPhoto}
            accent="primary"
          />
          <StatCard
            label="Produk"
            value={totalProducts}
            href="/admin/products"
            icon={IconShoppingCart}
            accent="default"
          />
          <StatCard
            label="Promo"
            value={totalPromos}
            href="/admin/promos"
            icon={IconSpeakerphone}
            accent="default"
          />
          <StatCard
            label="Artikel Publikasi"
            value={publishedArticles}
            sublabel={`dari ${totalArticles} total`}
            href="/admin/articles"
            icon={IconArticle}
            accent="success"
          />
          <StatCard
            label="Halaman Statis"
            value={totalPages}
            href="/admin/pages"
            icon={IconLayout}
            accent="default"
          />
        </div>
      </section>

      {/* Media & Leads */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Media & Leads
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="File Media"
            value={totalMedia}
            href="/admin/media"
            icon={IconPhotoPlus}
            accent="default"
          />
          <StatCard
            label="Total Leads"
            value={totalLeads}
            href="/admin/leads"
            icon={IconUserHeart}
            accent="warning"
          />
        </div>
      </section>

      {/* Recent Leads */}
      <section>
        <RecentLeadsTable leads={recentLeads} />
      </section>
    </div>
  );
}
