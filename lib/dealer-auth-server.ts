import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { isDealerPortalUser, DEALER_LOGIN_PATH } from '@/lib/dealer-portal';

export async function requireDealerPortalSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(DEALER_LOGIN_PATH);
  }
  if (!isDealerPortalUser(session.user.userType)) {
    redirect('/admin/dashboard');
  }
  return session;
}

export async function requireCmsSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }
  if (isDealerPortalUser(session.user.userType)) {
    redirect('/dealer/dashboard');
  }
  return session;
}
