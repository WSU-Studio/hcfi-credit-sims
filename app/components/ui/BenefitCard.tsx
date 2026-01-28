import type { Benefit } from "@/app/types";

type BenefitCardProps = Benefit & {
  className?: string;
};

export function BenefitCard({ title, description, className }: BenefitCardProps) {
  const base =
    "rounded-xl bg-white text-[var(--foreground)] shadow-md border border-[#002c5f]/20 px-4 py-3 hover:border-[#002c5f]/40 hover:shadow-lg transition-all";

  return (
    <div className={className ? `${base} ${className}` : base}>
      <p className="text-base font-semibold leading-snug text-[#002c5f] mb-2">{title}</p>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">{description}</p>
    </div>
  );
}

