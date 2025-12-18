import { HeroSlider } from "@/app/components/home/HeroSlider";
import { ProductSection } from "@/app/components/home/ProductSection";
import type { Benefit, Product, Slide } from "@/app/types";

const slides: Slide[] = [
  {
    title: "Dapatkan Benefit Kredit Mobil Baru Anda di",
    highlight: "Hyundai Finance",
    description:
      "Rasakan kemudahan proses kredit dengan layanan profesional dan penawaran yang terjaga keasliannya.",
    image: "/images/main-banner.jpg",
  },
];

const benefits: Benefit[] = [
  {
    title: "Jaminan Keaslian",
    description: "Semua penawaran dari kami terjaga keasliannya.",
  },
  {
    title: "Layanan Profesional",
    description: "Perjalanan memilih sampai pembelian Anda ditemani tenaga kami yang profesional.",
  },
];

const products: Product[] = [
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

export default function Home() {
  return (
    <>
      <HeroSlider slides={slides} benefits={benefits} />
      <ProductSection title="Kredit Pintar, Untuk Kebutuhan Anda" products={products} />
    </>
  );
}
