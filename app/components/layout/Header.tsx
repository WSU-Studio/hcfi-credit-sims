'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { NavItem } from "@/app/types";
import { Container } from "@/app/components/ui/Container";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import { IconMenu2 } from "@tabler/icons-react";

type HeaderProps = {
  items: NavItem[];
  locale: string;
};

export function Header({ items, locale }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#002c5f] shadow-lg">
      <Container className="flex items-center justify-between h-14 px-4 md:px--0 gap-3">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image src="/HF-logo.svg" className="brightness-0 invert" alt="Hyundai Capital" width={280} height={36} priority />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6 text-base lg:text-lg text-white">
            {items.map((item, index) => (
              <Link key={`${item.label}-${index}`} href={item.href} className="hover:text-white/80 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 ml-2 border-l border-white/30 pl-4">
            <Link
              href={pathname}
              locale="id"
              className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                locale === "id" ? "bg-white/20 text-white" : "text-white/80 hover:text-white"
              }`}
            >
              ID
            </Link>
            <Link
              href={pathname}
              locale="en"
              className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                locale === "en" ? "bg-white/20 text-white" : "text-white/80 hover:text-white"
              }`}
            >
              EN
            </Link>
          </div>
        </div>

        <button
          type="button"
          aria-label={t("menu")}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-10 w-10 items-center justify-center text-white md:hidden hover:bg-white/10 transition-colors"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">{t("menu")}</span>
          <IconMenu2 />
        </button>
      </Container>

      {open ? (
        <div id="mobile-menu" className="border-t border-white/20 bg-[#002c5f] md:hidden">
          <Container className="flex flex-col gap-3 py-3">
            {items.map((item, index) => (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                className="py-2 px-4 text-sm font-medium text-white hover:text-white/80 transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-4 px-4 border-t border-white/20">
              <Link href={pathname} locale="id" className={`py-2 text-sm font-medium text-white/90 rounded-lg p-4 transition-colors border-sky-600/20 border ${locale === "id" ? "bg-sky-600/20 text-white" : "text-white/80 hover:bg-sky-600/20 hover:text-white"}`} onClick={() => setOpen(false)}>
                ID
              </Link>
              <Link href={pathname} locale="en" className={`py-2 text-sm font-medium text-white/90 rounded-lg p-4 transition-colors border-sky-600/20 border ${locale === "en" ? "bg-sky-600/20 text-white" : "text-white/80 hover:bg-sky-600/20 hover:text-white"}`} onClick={() => setOpen(false)}>
                EN
              </Link>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
