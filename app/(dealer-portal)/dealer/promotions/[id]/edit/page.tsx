import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/permissions';
import { DealerPromotionForm } from '@/app/components/dealer/promotions/DealerPromotionForm';

export default async function EditDealerPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requirePermission('DEALER_PROMOTIONS', 'edit');
  } catch {
    redirect('/dealer/promotions');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Promo Diskon</h1>
        <p className="mt-1 text-sm text-gray-500">Perbarui nilai atau periode promo</p>
      </div>
      <DealerPromotionForm promotionId={id} />
    </div>
  );
}
