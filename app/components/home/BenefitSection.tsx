'use client';

import type { Benefit } from "@/app/types";
import { useTranslations } from "next-intl";
import { Container } from "@/app/components/ui/Container";
import { BenefitCard } from "@/app/components/ui/BenefitCard";

type BenefitSectionProps = {
  benefits: Benefit[];
  headingLine1?: string;
  headingLine2?: string;
  headingLine3?: string;
  headingBrand?: string;
};

export function BenefitSection({
  benefits,
  headingLine1,
  headingLine2,
  headingLine3,
  headingBrand,
}: BenefitSectionProps) {
  const t = useTranslations("home");
  const displayBenefits = benefits && benefits.length > 0 ? benefits : [
    { title: "Jaminan Keaslian", description: "Semua penawaran dari kami terjaga keasliannya." },
    { title: "Layanan Profesional", description: "Perjalanan memilih sampai pembelian Anda ditemani tenaga kami yang profesional." },
  ];
  const line1 = headingLine1?.trim() || t("benefitHeading1");
  const line2 = headingLine2?.trim() || t("benefitHeading2");
  const line3 = headingLine3?.trim() || t("benefitHeading3");
  const brand = headingBrand?.trim() || t("benefitBrand");

  return (
    <section id="benefits" className="bg-slate-100 py-6 md:py-8">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-[var(--foreground)]">
              <span className="block">{line1}</span>
              <span className="block">{line2}</span>
              <span className="block">
                {line3} <span className="text-[#002c5f]">{brand}</span>
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
