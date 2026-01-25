'use client';

import { useState } from "react";
import type { NavItem } from "@/app/types";
import { Container } from "@/app/components/ui/Container";
import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  items: NavItem[];
};

export function Header({ items }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#008AEC] backdrop-blur shadow-lg">
      <Container className="flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image src="/HF-logo.svg" className="brightness-0 invert" alt="Hyundai Capital" width={280} height={36} priority />
          </Link>
        </div>

        <nav className="hidden gap-6 text-base lg:text-lg text-white md:flex">
          {items.map((item, index) => (
            <Link key={`${item.label}-${index}`} href={item.href} className="hover:text-white/80 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 text-white md:hidden hover:bg-white/10 transition-colors"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-[6px]">
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </div>
        </button>
      </Container>

      {open ? (
        <div id="mobile-menu" className="border-t border-white/20 bg-[#008AEC] md:hidden">
          <Container className="flex flex-col gap-3 py-3">
            {items.map((item, index) => (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                className="py-2 text-sm font-medium text-white hover:text-white/80 transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </div>
      ) : null}
    </header>
  );
}

