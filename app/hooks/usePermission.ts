'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { PermissionAction } from '@/lib/permissions';

export function usePermission(menuCode: string, action: PermissionAction = 'view') {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    fetch(`/api/permissions/check?menuCode=${menuCode}&action=${action}`)
      .then((res) => res.json())
      .then((data) => {
        setHasPermission(data.hasPermission || false);
        setLoading(false);
      })
      .catch(() => {
        setHasPermission(false);
        setLoading(false);
      });
  }, [session, menuCode, action, status]);

  return { hasPermission, loading };
}


