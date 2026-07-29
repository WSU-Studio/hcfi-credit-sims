'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { PermissionAction } from '@/lib/permissions';

export type UserPermissions = Record<
  string,
  { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }
>;

export function useUserPermissions() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      queueMicrotask(() => {
        setPermissions(null);
        setLoading(false);
      });
      return;
    }

    fetch('/api/permissions/me', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) {
          setPermissions({});
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPermissions(data.permissions ?? {});
        setLoading(false);
      })
      .catch(() => {
        setPermissions({});
        setLoading(false);
      });
  }, [session?.user?.id, status]);

  return { permissions, loading };
}

export function usePermission(menuCode: string, action: PermissionAction = 'view') {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      queueMicrotask(() => {
        setHasPermission(false);
        setLoading(false);
      });
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


