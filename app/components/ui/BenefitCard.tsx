import type { Benefit } from "@/app/types";

type BenefitCardProps = Benefit & {
  className?: string;
};

export function BenefitCard({ title, description, className }: BenefitCardProps) {
  const base =
    "rounded-2xl bg-[var(--card)] text-[var(--foreground)] shadow-md border border-[var(--border)] px-6 py-5 hover:border-[#008AEC]/30 transition-all";

  return (
    <div className={className ? `${base} ${className}` : base}>
      <p className="text-base font-semibold leading-snug text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{description}</p>
    </div>
  );
}

