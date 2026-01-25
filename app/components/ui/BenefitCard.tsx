import type { Benefit } from "@/app/types";

type BenefitCardProps = Benefit & {
  className?: string;
};

export function BenefitCard({ title, description, className }: BenefitCardProps) {
  const base =
    "rounded-xl bg-white text-[var(--foreground)] shadow-md border border-[#008AEC]/20 px-6 py-5 hover:border-[#008AEC]/40 hover:shadow-lg transition-all";

  return (
    <div className={className ? `${base} ${className}` : base}>
      <p className="text-base font-semibold leading-snug text-[#008AEC] mb-2">{title}</p>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">{description}</p>
    </div>
  );
}

