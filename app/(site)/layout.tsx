import type { Metadata } from "next";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { WhatsappFAB } from "../components/layout/WhatsappFAB";
import { CompanyInfo, NavItem } from "../types";
import { IconBrandWhatsapp, IconPhone, IconMail } from "@tabler/icons-react";
import { prisma } from "@/lib/prisma";

async function getStaticPages() {
  try {
    return await prisma.staticPage.findMany({
      orderBy: [{ menuOrder: "asc" }, { title: "asc" }],
    });
  } catch (error) {
    console.error("Error fetching static pages:", error);
    return [];
  }
}

function buildNavItems(
  pages: Awaited<ReturnType<typeof getStaticPages>>
): NavItem[] {
  const fixed: NavItem[] = [
    { label: "Simulasi Kredit", href: "/simulasi-kredit" },
    { label: "Promosi", href: "/promo" },
    { label: "Informasi", href: "/informasi" },
  ];
  const menuPages = pages
    .filter((p) => p.showInMenu)
    .map((p) => ({ label: p.title, href: `/${p.slug}` }));
  return [...fixed, ...menuPages];
}

async function getFooterData(
  pages: Awaited<ReturnType<typeof getStaticPages>>
): Promise<CompanyInfo> {
  try {
    const settings = await prisma.footerSetting.findMany();
    const data: Record<string, unknown> = {};

    settings.forEach((setting) => {
      try {
        data[setting.key] = JSON.parse(setting.value);
      } catch {
        data[setting.key] = setting.value;
      }
    });

    const legalPages = pages.filter(
      (p) => p.slug === "privacy-policy" || p.slug === "terms-condition"
    );
    const legalLinks = legalPages.map((page) => ({
      label: page.title,
      href: `/${page.slug}`,
    }));

    const defaultAddress = [
      "PT Hyundai Capital Finance Indonesia",
      "Sequis Tower, 23rd Floor, Unit 1 - 7, Jl. Jenderal Sudirman",
      "Kav. 71, Senayan, Kebayoran Baru, South Jakarta, 12190",
    ];
    const defaultContact: CompanyInfo["contact"] = [
      { label: "Call", icon: <IconPhone size={16} />, text: "1500708", href: "tel:1500708" },
      { label: "WhatsApp", icon: <IconBrandWhatsapp size={16} />, text: "08111500708", href: "tel:08111500708" },
      { label: "Email", icon: <IconMail size={16} />, text: "contactus@hyundaicapital.co.id", href: "mailto:contactus@hyundaicapital.co.id" },
    ];
    const defaultApps: CompanyInfo["apps"] = [
      { label: "Google Play", src: "/images/play-store.png", href: "#" },
      { label: "App Store", src: "/images/app-store.png", href: "#" },
    ];
    return {
      name: "Hyundai Capital",
      address: Array.isArray(data.address) ? data.address : defaultAddress,
      legalLinks: legalLinks.length > 0 ? legalLinks : [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms & Condition", href: "#" },
      ],
      contact: Array.isArray(data.contact) ? data.contact : defaultContact,
      apps: Array.isArray(data.apps) ? data.apps : defaultApps,
      disclaimer:
        "PT Hyundai Capital Finance Indonesia berizin dan diawasi oleh Otoritas Jasa Keuangan",
      copyright: "Copyright © 2025 - All Right Reserved",
    };
  } catch {
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
  const pages = await getStaticPages();
  const navItems = buildNavItems(pages);
  const companyInfo = await getFooterData(pages);

  return (
    <>
      <Header items={navItems} />
      <main className="pt-14 pb-16">
        {children}
      </main>

      <WhatsappFAB />

      <div id="footer">
        <Footer company={companyInfo} />
      </div>
    </>
  );
}

