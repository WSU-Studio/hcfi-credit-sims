import { HeroSlider } from "@/app/components/home/HeroSlider";
import { ProductSection } from "@/app/components/home/ProductSection";
import { BenefitSection } from "@/app/components/home/BenefitSection";
import { ArticleSection } from "@/app/components/home/ArticleSection";
import type { Benefit, Product, Slide, Article } from "@/app/types";
import { prisma } from "@/lib/prisma";

// Agar banner, benefits, products selalu di-fetch fresh dari DB (tidak di-cache saat build).
// Tanpa ini, halaman di-static generate saat deploy dan update DB lewat admin tidak muncul di home.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Hyundai Capital",
    description: "Hyundai Capital adalah perusahaan kredit yang menyediakan kredit untuk pembelian mobil Hyundai.",
  };
}

async function getBanners() {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        order: 'asc',
      },
    });

    return banners.map((banner) => ({
      title: banner.title,
      highlight: banner.highlight || '',
      description: banner.description || '',
      image: banner.imageUrl,
      ctaLabel: banner.ctaLabel ?? undefined,
      ctaUrl: banner.ctaUrl ?? undefined,
    })) as Slide[];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [
      {
        title: "Dapatkan Benefit Kredit Mobil Baru Anda di",
        highlight: "Hyundai Finance",
        description:
          "Rasakan kemudahan proses kredit dengan layanan profesional dan penawaran yang terjaga keasliannya.",
        image: "/images/main-banner.jpg",
        ctaLabel: "Simulasi Kredit",
        ctaUrl: "/credit-simulation",
      },
    ];
  }
}

async function getBenefits() {
  try {
    const benefits = await prisma.benefit.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return benefits.map((benefit) => ({
      title: benefit.title,
      description: benefit.description,
    })) as Benefit[];
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return [
      {
        title: "Jaminan Keaslian",
        description: "Semua penawaran dari kami terjaga keasliannya.",
      },
      {
        title: "Layanan Profesional",
        description: "Perjalanan memilih sampai pembelian Anda ditemani tenaga kami yang profesional.",
      },
    ];
  }
}

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return products.map((product) => ({
      title: product.title,
      subtitle: product.subtitle || undefined,
      image: product.imageUrl,
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [
      {
        title: "Smart Installment Program",
        subtitle: "Stargazer & Creta",
        image: "/images/product-01.jpg",
      },
      {
        title: "Kredit 50:50",
        subtitle: "Bebas Angsuran 1 Tahun",
        image: "/images/product-02.jpg",
      },
      {
        title: "Balloon Payment",
        subtitle: "Lebih Leluasa & Ringan",
        image: "/images/product-03.jpg",
      },
    ];
  }
}

async function getArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return articles.map((article) => ({
      title: article.title,
      image: article.imageUrl ?? "/images/main-banner.jpg",
      slug: article.slug ?? undefined,
    })) as Article[];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export default async function Home() {
  const [slides, benefits, products, articles ] = await Promise.all([
    getBanners(),
    getBenefits(),
    getProducts(),
    getArticles(),
  ]);

  return (
    <>
      <HeroSlider slides={slides} />
      
      <BenefitSection benefits={benefits} />

      <ProductSection title="Kredit Pintar, Untuk Kebutuhan Anda" products={products} />

      <ArticleSection articles={articles} />
    </>
  );
}

