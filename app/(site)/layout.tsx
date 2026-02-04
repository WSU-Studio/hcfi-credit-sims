import type { Metadata } from "next";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { WhatsappFAB } from "../components/layout/WhatsappFAB";
import { CompanyInfo, NavItem } from "../types";
import { IconBrandWhatsapp, IconBrandInstagram, IconPhone, IconMail } from "@tabler/icons-react";
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
    { label: "Simulasi Kredit", href: "/credit-simulation" },
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
      { label: "WhatsApp", icon: <IconBrandWhatsapp size={16} />, text: "08111500708", href: "https://wa.me/628111500708" },
      { label: "Email", icon: <IconMail size={16} />, text: "contactus@hyundaicapital.co.id", href: "mailto:contactus@hyundaicapital.co.id" },
    ];
    const defaultApps: CompanyInfo["apps"] = [
      { label: "Google Play", src: "/images/play-store.png", href: "#" },
      { label: "App Store", src: "/images/app-store.png", href: "#" },
    ];

    const str = (v: unknown) => (typeof v === "string" ? v : "");

    const hasNewFields = str(data.phoneDisplay) || str(data.phoneHref) || str(data.whatsappDisplay) || str(data.whatsappHref) || str(data.emailDisplay) || str(data.emailHref);
    const contactFromOld = Array.isArray(data.contact)
      ? (data.contact as { label?: string; text?: string; href?: string }[]).map((item) => {
          const labelLower = (item.label || "").toLowerCase();
          const icon =
            labelLower.includes("whatsapp") ? <IconBrandWhatsapp size={16} /> :
            labelLower.includes("instagram") ? <IconBrandInstagram size={16} /> :
            labelLower.includes("call") || labelLower.includes("tel") ? <IconPhone size={16} /> :
            labelLower.includes("email") || labelLower.includes("mail") ? <IconMail size={16} /> :
            null;
          return {
            label: item.label || "",
            text: item.text || "",
            href: item.href || "",
            icon: icon ?? undefined,
          };
        })
      : [];

    let contact: CompanyInfo["contact"];
    if (hasNewFields) {
      const contactFromFields: CompanyInfo["contact"] = [];
      if (str(data.phoneDisplay) || str(data.phoneHref)) {
        contactFromFields.push({
          label: "Call",
          icon: <IconPhone size={16} />,
          text: str(data.phoneDisplay) || str(data.phoneHref),
          href: str(data.phoneHref) || (str(data.phoneDisplay) ? `tel:${str(data.phoneDisplay).replace(/\s/g, "")}` : ""),
        });
      }
      if (str(data.whatsappDisplay) || str(data.whatsappHref)) {
        const raw = str(data.whatsappHref) || str(data.whatsappDisplay);
        const digits = raw.replace(/\D/g, "");
        const waNum = digits ? (digits.startsWith("0") ? "62" + digits.slice(1) : digits.startsWith("62") ? digits : "62" + digits) : "";
        const waHref = raw.toLowerCase().startsWith("http") ? raw : (waNum ? `https://wa.me/${waNum}` : "");
        contactFromFields.push({
          label: "WhatsApp",
          icon: <IconBrandWhatsapp size={16} />,
          text: str(data.whatsappDisplay) || raw,
          href: waHref,
        });
      }
      if (str(data.emailDisplay) || str(data.emailHref)) {
        const emailAddr = str(data.emailHref) || str(data.emailDisplay);
        const mailto = emailAddr ? (emailAddr.toLowerCase().startsWith("mailto:") ? emailAddr : `mailto:${emailAddr.trim()}`) : "";
        contactFromFields.push({
          label: "Email",
          icon: <IconMail size={16} />,
          text: str(data.emailDisplay) || emailAddr,
          href: mailto,
        });
      }
      contact = contactFromFields.length > 0 ? contactFromFields : defaultContact;
    } else {
      contact = contactFromOld.length > 0 ? contactFromOld : defaultContact;
    }

    const playStoreHref = str(data.playStoreHref);
    const appStoreHref = str(data.appStoreHref);
    const appsFromData = Array.isArray(data.apps) ? data.apps as { label?: string; src?: string; href?: string }[] : [];
    const apps: CompanyInfo["apps"] =
      playStoreHref || appStoreHref
        ? [
            { label: "Google Play", src: "/images/play-store.png", href: playStoreHref || (appsFromData[0]?.href as string) || "#" },
            { label: "App Store", src: "/images/app-store.png", href: appStoreHref || (appsFromData[1]?.href as string) || "#" },
          ]
        : appsFromData.length > 0
          ? appsFromData.map((a) => ({ label: a.label || "", src: a.src || "", href: a.href || "#" }))
          : defaultApps;

    return {
      name: "Hyundai Capital",
      address: Array.isArray(data.address) ? data.address : defaultAddress,
      legalLinks: legalLinks.length > 0 ? legalLinks : [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms & Condition", href: "#" },
      ],
      contact,
      apps,
      disclaimer:
        typeof data.disclaimer === "string" && data.disclaimer.trim()
          ? data.disclaimer
          : "PT Hyundai Capital Finance Indonesia berizin dan diawasi oleh Otoritas Jasa Keuangan",
      copyright:
        typeof data.copyright === "string" && data.copyright.trim()
          ? data.copyright
          : "Copyright © 2025 - All Right Reserved",
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

