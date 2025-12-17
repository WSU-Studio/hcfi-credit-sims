import { Footer } from "@/app/components/layout/Footer";
import { Header } from "@/app/components/layout/Header";
import { HeroSlider } from "@/app/components/home/HeroSlider";
import { ProductSection } from "@/app/components/home/ProductSection";
import type { Benefit, CompanyInfo, NavItem, Product, Slide } from "@/app/types";

const navItems: NavItem[] = [
  { label: "Simulasi Kredit", href: "#hero" },
  { label: "Promosi", href: "#products" },
  { label: "Informasi", href: "#footer" },
];

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

const companyInfo: CompanyInfo = {
  name: "Hyundai Capital",
  address: [
    "PT Hyundai Capital Finance Indonesia",
    "Sequis Tower, 23rd Floor, Unit 1 - 7, Jl. Jenderal Sudirman",
    "Kav. 71, Senayan, Kebayoran Baru, South Jakarta, 12190",
  ],
  legalLinks: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms & Condition", href: "#" },
  ],
  contact: [
    { label: "Call", text: "1500708", href: "tel:1500708" },
    { label: "WhatsApp", text: "08111500708", href: "tel:08111500708" },
    { label: "Email", text: "contactus@hyundaicapital.co.id", href: "mailto:contactus@hyundaicapital.co.id" },
  ],
  apps: [
    { label: "Google Play", href: "#" },
    { label: "App Store", href: "#" },
  ],
  disclaimer:
    "PT Hyundai Capital Finance Indonesia berizin dan diawasi oleh Otoritas Jasa Keuangan",
  copyright: "Copyright © 2025 - All Right Reserved",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header items={navItems} />
      <main className="pb-16">
        <HeroSlider slides={slides} benefits={benefits} />
        <ProductSection title="Kredit Pintar, Untuk Kebutuhan Anda" products={products} />
      </main>
      <div id="footer">
        <Footer company={companyInfo} />
      </div>
    </div>
  );
}
