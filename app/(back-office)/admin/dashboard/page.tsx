import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Banners</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Published Articles</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>
    </div>
  );
}

