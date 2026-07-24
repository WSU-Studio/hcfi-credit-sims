'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';

type PurgeStatus = {
  enabled: boolean;
  phraseConfigured: boolean;
  leadCount: number;
  draftCount: number;
};

type Message = { type: 'success' | 'error'; text: string };

/**
 * Danger Zone: bulk hapus semua leads.
 * Hanya tampil jika role punya activity `leads.purgeAll`.
 * Phrase & flag enable dicek server-side (env); UI tidak pernah menerima phrase.
 */
export function LeadsPurgeDangerZone() {
  const [canPurge, setCanPurge] = useState(false);
  const [status, setStatus] = useState<PurgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [purging, setPurging] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetch('/api/admin/me/activities')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const acts: string[] = data.activities || [];
        setCanPurge(acts.includes('leads.purgeAll'));
      })
      .catch(() => setCanPurge(false));
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads/purge');
      if (res.status === 403 || res.status === 401) {
        setStatus(null);
        return;
      }
      if (!res.ok) throw new Error('Gagal memuat status purge');
      const data = (await res.json()) as PurgeStatus;
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canPurge) {
      setLoading(false);
      return;
    }
    loadStatus();
  }, [canPurge, loadStatus]);

  if (!canPurge) return null;

  const canSubmit =
    !!status?.enabled &&
    !!status?.phraseConfigured &&
    confirmPhrase.trim().length > 0 &&
    !purging;

  const handlePurge = async () => {
    setMessage(null);
    if (!confirmPhrase.trim()) return;

    const leadN = status?.leadCount ?? 0;
    const draftN = status?.draftCount ?? 0;
    const ok = window.confirm(
      `Hapus permanen ${leadN} lead dan ${draftN} draft aset?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    if (!ok) return;

    setPurging(true);
    try {
      const res = await fetch('/api/admin/leads/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPhrase: confirmPhrase.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Gagal menghapus leads');
      }
      setConfirmPhrase('');
      setMessage({
        type: 'success',
        text: `Berhasil menghapus ${json.deletedLeads ?? 0} lead dan ${json.deletedDrafts ?? 0} draft.`,
      });
      await loadStatus();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menghapus leads',
      });
    } finally {
      setPurging(false);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-red-200 bg-red-50/40 p-5">
      <div className="flex items-start gap-3 border-b border-red-200 pb-3">
        <IconAlertTriangle size={22} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          <p className="mt-1 text-sm text-red-800/80">
            Hapus semua data leads di database (termasuk draft aset simulasi). File KTP di storage
            tidak dihapus. Matikan fitur lewat env setelah masa uji selesai.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-300 bg-white text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading || !status ? (
        <p className="text-sm text-gray-600">Memuat status…</p>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-md bg-white/80 px-3 py-2 border border-red-100">
              <dt className="text-gray-500">Jumlah leads</dt>
              <dd className="text-lg font-semibold text-gray-900">{status.leadCount}</dd>
            </div>
            <div className="rounded-md bg-white/80 px-3 py-2 border border-red-100">
              <dt className="text-gray-500">Draft aset</dt>
              <dd className="text-lg font-semibold text-gray-900">{status.draftCount}</dd>
            </div>
            <div className="rounded-md bg-white/80 px-3 py-2 border border-red-100">
              <dt className="text-gray-500">Status fitur</dt>
              <dd className="text-lg font-semibold text-gray-900">
                {status.enabled && status.phraseConfigured ? (
                  <span className="text-amber-700">Aktif</span>
                ) : (
                  <span className="text-gray-500">Nonaktif</span>
                )}
              </dd>
            </div>
          </dl>

          {!status.enabled && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Purge dinonaktifkan. Set <code className="font-mono text-xs">ALLOW_LEADS_PURGE=true</code>{' '}
              di environment server, lalu restart.
            </p>
          )}
          {status.enabled && !status.phraseConfigured && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Phrase belum dikonfigurasi. Set{' '}
              <code className="font-mono text-xs">LEADS_PURGE_CONFIRM_PHRASE</code> di environment
              server.
            </p>
          )}

          <div>
            <label htmlFor="leads-purge-phrase" className="block text-sm font-medium text-gray-800 mb-1">
              Masukkan phrase konfirmasi
            </label>
            <input
              id="leads-purge-phrase"
              type="text"
              autoComplete="off"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              disabled={!status.enabled || !status.phraseConfigured || purging}
              className="w-full max-w-md px-3 py-2 border border-red-200 rounded-lg text-gray-800 text-sm font-mono focus:ring-2 focus:ring-red-400 focus:border-red-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Phrase konfirmasi"
            />
          </div>

          <button
            type="button"
            onClick={handlePurge}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconTrash size={18} />
            {purging ? 'Menghapus…' : 'Hapus semua leads'}
          </button>
        </div>
      )}
    </section>
  );
}
