import { HeroSlider } from "@/app/components/home/HeroSlider";
import { ProductSection } from "@/app/components/home/ProductSection";
import { BenefitSection } from "@/app/components/home/BenefitSection";
import type { Benefit, Product, Slide } from "@/app/types";
import { prisma } from "@/lib/prisma";

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

export default async function Home() {
  const [slides, benefits, products] = await Promise.all([
    getBanners(),
    getBenefits(),
    getProducts(),
  ]);

  return (
    <>
      <HeroSlider slides={slides} benefits={benefits} />
      
      <BenefitSection benefits={benefits} />

      <ProductSection title="Kredit Pintar, Untuk Kebutuhan Anda" products={products} />
    </>
  );
}

