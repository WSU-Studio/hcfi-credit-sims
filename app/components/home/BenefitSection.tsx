'use client';

import type { Benefit } from "@/app/types";
import { useTranslations } from "next-intl";
import { Container } from "@/app/components/ui/Container";
import { BenefitCard } from "@/app/components/ui/BenefitCard";

type BenefitSectionProps = {
  benefits: Benefit[];
};

export function BenefitSection({ benefits }: BenefitSectionProps) {
  const t = useTranslations("home");
  const displayBenefits = benefits && benefits.length > 0 ? benefits : [
    { title: "Jaminan Keaslian", description: "Semua penawaran dari kami terjaga keasliannya." },
    { title: "Layanan Profesional", description: "Perjalanan memilih sampai pembelian Anda ditemani tenaga kami yang profesional." },
  ];

  return (
    <section id="benefits" className="bg-slate-100 py-6 md:py-8">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-[var(--foreground)]">
              <span className="block">{t("benefitHeading1")}</span>
              <span className="block">{t("benefitHeading2")}</span>
              <span className="block">
                {t("benefitHeading3")} <span className="text-[#002c5f]">{t("benefitBrand")}</span>
              </span>
            </h2>
          </div>
          <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-2 w-full">
            {displayBenefits.map((benefit, index) => (
              <BenefitCard
                key={`${benefit.title}-${index}`}
                {...benefit}
                className="hover:shadow-lg transition-shadow"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
