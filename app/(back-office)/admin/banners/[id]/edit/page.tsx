import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { BannerForm } from '@/app/components/admin/banners/BannerForm';

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('BANNERS', 'edit');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don't have permission to edit banners.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Banner</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update banner information
        </p>
      </div>
      <BannerForm bannerId={id} />
    </div>
  );
}

