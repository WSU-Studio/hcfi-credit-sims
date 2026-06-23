type DealerComingSoonProps = {
  title: string;
  description: string;
};

export function DealerComingSoon({ title, description }: DealerComingSoonProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-950/10 text-blue-950 text-2xl font-bold">
        …
      </div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      <p className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
        Segera hadir — Phase berikutnya
      </p>
    </div>
  );
}
