'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type AdminNavigationContextValue = {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
};

const AdminNavigationContext = createContext<AdminNavigationContextValue | null>(null);

export function useAdminNavigation() {
  const ctx = useContext(AdminNavigationContext);
  if (!ctx) return { isNavigating: false, setNavigating: () => {} };
  return ctx;
}

export function AdminNavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setNavigating] = useState(false);

  return (
    <AdminNavigationContext.Provider value={{ isNavigating, setNavigating }}>
      {isNavigating && (
        <div
          className="fixed right-12 bottom-12 z-[100] flex items-center justify-center p-3 bg-white rounded-full shadow-lg"
          aria-hidden
          aria-busy="true"
        >
          <div
            className="h-10 w-10 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin"
          />
        </div>
      )}
      {children}
    </AdminNavigationContext.Provider>
  );
}
