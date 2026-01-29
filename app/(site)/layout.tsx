import type { Metadata } from "next";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { CompanyInfo, NavItem } from "../types";
import { IconBrandWhatsapp, IconPhone, IconMail } from "@tabler/icons-react";
import { prisma } from "@/lib/prisma";

const navItems: NavItem[] = [
  { label: "Simulasi Kredit", href: "/simulasi-kredit" },
  { label: "Promosi", href: "#products" },
  { label: "Informasi", href: "#footer" },
];

async function getFooterData(): Promise<CompanyInfo> {
  try {
    const settings = await prisma.footerSetting.findMany();
    const data: any = {};

    settings.forEach((setting) => {
      try {
        data[setting.key] = JSON.parse(setting.value);
      } catch {
        data[setting.key] = setting.value;
      }
    });

    // Get static pages for legal links
    const pages = await prisma.staticPage.findMany({
      where: {
        slug: {
          in: ['privacy-policy', 'terms-condition'],
        },
      },
    });

    const legalLinks = pages.map((page) => ({
      label: page.title,
      href: `/${page.slug}`,
    }));

    return {
      name: "Hyundai Capital",
      address: data.address || [
        "PT Hyundai Capital Finance Indonesia",
        "Sequis Tower, 23rd Floor, Unit 1 - 7, Jl. Jenderal Sudirman",
        "Kav. 71, Senayan, Kebayoran Baru, South Jakarta, 12190",
      ],
      legalLinks: legalLinks.length > 0 ? legalLinks : [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms & Condition", href: "#" },
      ],
      contact: data.contact || [
        { label: "Call", icon: <IconPhone size={16} />, text: "1500708", href: "tel:1500708" },
        { label: "WhatsApp", icon: <IconBrandWhatsapp size={16} />, text: "08111500708", href: "tel:08111500708" },
        { label: "Email", icon: <IconMail size={16} />, text: "contactus@hyundaicapital.co.id", href: "mailto:contactus@hyundaicapital.co.id" },
      ],
      apps: data.apps || [
        { label: "Google Play", src: "/images/play-store.png", href: "#" },
        { label: "App Store", src: "/images/app-store.png", href: "#" },
      ],
      disclaimer:
        "PT Hyundai Capital Finance Indonesia berizin dan diawasi oleh Otoritas Jasa Keuangan",
      copyright: "Copyright © 2025 - All Right Reserved",
    };
  } catch (error) {
    // Fallback to default
    return {
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
        { label: "Call", icon: <IconPhone size={16} />, text: "1500708", href: "tel:1500708" },
        { label: "WhatsApp", icon: <IconBrandWhatsapp size={16} />, text: "08111500708", href: "tel:08111500708" },
        { label: "Email", icon: <IconMail size={16} />, text: "contactus@hyundaicapital.co.id", href: "mailto:contactus@hyundaicapital.co.id" },
      ],
      apps: [
        { label: "Google Play", src: "/images/play-store.png", href: "#" },
        { label: "App Store", src: "/images/app-store.png", href: "#" },
      ],
      disclaimer:
        "PT Hyundai Capital Finance Indonesia berizin dan diawasi oleh Otoritas Jasa Keuangan",
      copyright: "Copyright © 2025 - All Right Reserved",
    };
  }
}

export const metadata: Metadata = {
  title: "Hyundai Capital - Simulasi Kredit",
  description: "Simulasi kredit pembiayaan kendaraan dengan layanan profesional",
};

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const companyInfo = await getFooterData();

  return (
    <>
      <Header items={navItems} />
      <main className="pt-14 pb-16">
        {children}
      </main>
      <div id="footer">
        <Footer company={companyInfo} />
      </div>
    </>
  );
}

