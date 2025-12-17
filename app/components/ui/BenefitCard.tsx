import type { Benefit } from "@/app/types";

type BenefitCardProps = Benefit & {
  className?: string;
};

export function BenefitCard({ title, description, className }: BenefitCardProps) {
  const base =
    "rounded-2xl bg-[var(--card)] text-[var(--foreground)] shadow-md shadow-black/40 border border-[var(--border)] px-4 py-3";

  return (
    <div className={className ? `${base} ${className}` : base}>
      <p className="text-base font-semibold leading-snug">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{description}</p>
    </div>
  );
}

