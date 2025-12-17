import type { CompanyInfo } from "@/app/types";
import { Container } from "@/app/components/ui/Container";

type FooterProps = {
  company: CompanyInfo;
};

export function Footer({ company }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[#1b1b1b] text-sm text-[var(--muted)]">
      <Container className="space-y-8 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              {company.name}
            </div>
            <div className="space-y-1 leading-relaxed">
              {company.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-3 text-xs text-white/80">
              {company.legalLinks.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-[var(--accent)]">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-white">Customer Care</p>
            <ul className="space-y-2 leading-relaxed">
              {company.contact.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <a href={item.href} className="hover:text-[var(--accent)]">
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-white">Unduh Aplikasi</p>
            <div className="flex flex-wrap gap-3">
              {company.apps.map((app) => (
                <a
                  key={app.href}
                  href={app.href}
                  className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-white/5 px-4 py-3 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                >
                  {app.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 text-xs leading-relaxed">
          {company.disclaimer ? <p className="mb-2">{company.disclaimer}</p> : null}
          <p>{company.copyright ?? `Copyright © ${new Date().getFullYear()} - All Rights Reserved`}</p>
        </div>
      </Container>
    </footer>
  );
}

