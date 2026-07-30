'use client';

import { Suspense, useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Providers } from '@/app/providers';
import { DEALER_PORTAL_HOME } from '@/lib/dealer-portal';

function DealerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const callbackUrl = searchParams.get('callbackUrl') || DEALER_PORTAL_HOME;
      const result = await signIn('credentials', {
        email,
        password,
        rememberMe: String(rememberMe),
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password salah');
        return;
      }

      const meRes = await fetch('/api/dealer/me');
      const meData = await meRes.json();

      if (!meRes.ok || !meData.isDealerPortalUser) {
        await signOut({ redirect: false });
        setError('Akun ini tidak memiliki akses portal dealer. Hubungi admin HCFI.');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      console.error('Dealer login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002c5f] via-[#003d82] to-[#001a3a] px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#002c5f]/70">
            Hyundai Capital
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
            Dealer Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Login untuk Dealer Admin & Salesman
          </p>
        </div>

        <form
          className="space-y-5"
          method="post"
          action="/dealer/login"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]"
                placeholder="nama@dealer.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#002c5f] focus:ring-[#002c5f]"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Ingat saya (30 hari)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#002c5f] hover:bg-[#001f45] focus:ring-2 focus:ring-offset-2 focus:ring-[#002c5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>

          <div className="flex flex-col items-center gap-2 text-sm">
            <Link href="/" className="text-[#002c5f] hover:underline">
              Kembali ke website
            </Link>
            <Link href="/auth/login" className="text-gray-500 hover:text-gray-700">
              Login CMS Admin →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DealerLoginPage() {
  return (
    <Providers>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#002c5f] text-white">
            Memuat...
          </div>
        }
      >
        <DealerLoginForm />
      </Suspense>
    </Providers>
  );
}
