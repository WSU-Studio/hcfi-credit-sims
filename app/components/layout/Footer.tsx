import type { CompanyInfo } from "@/app/types";
import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import Image from "next/image";

type FooterProps = {
  company: CompanyInfo;
};

export function Footer({ company }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-slate-100/90 text-sm text-slate-700">
      <Container className="space-y-8 py-12">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <Image src="/HF-logo.svg" alt="Hyundai Capital" width={240} height={28} priority />
            <div className="space-y-1 leading-relaxed text-[var(--muted)]">
              {company.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-3 text-xs">
              {company.legalLinks.map((link, index) => (
                <Link 
                  key={`${link.label}-${index}`} 
                  href={link.href} 
                  className="text-[#008AEC] hover:text-[#1956FF] font-medium transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 text-xs leading-relaxed text-[var(--muted)]">
              {company.disclaimer ? <p className="mb-2">{company.disclaimer}</p> : null}
              <p>{company.copyright ?? `Copyright © ${new Date().getFullYear()} - All Rights Reserved`}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-[var(--foreground)]">Customer Care</p>
            <ul className="space-y-2 leading-relaxed text-[var(--muted)]">
              {company.contact.map((item, index) => (
                <li key={`${item.text}-${index}`}>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-[var(--accent)] flex items-center gap-2 transition-colors">
                      {item.icon}
                      {item.text}
                    </Link>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>

            <p className="text-sm text-slate-700">
              Unduh Aplikasi Hyundai Finance di:
            </p>
            <div className="flex flex-wrap gap-2">
              {company.apps.map((app, index) => (
                <Link
                  key={`${app.label}-${index}`}
                  href={app.href}
                  className="flex items-center justify-center rounded-sm border border-[var(--border)] bg-white transition duration-300 hover:border-[var(--accent)] hover:shadow-md overflow-hidden"
                >
                  <Image src={app.src} alt={app.label} width={128} height={100} priority />
                </Link>
              ))}
            </div>
          </div>
        </div>
        
      </Container>
    </footer>
  );
}

