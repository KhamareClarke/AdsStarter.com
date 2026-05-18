'use client';

import { useState } from 'react';

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook / Instagram',
    description: 'Meta Ads Manager — campaigns, ads, insights',
    connectUrl: '/api/integrations/facebook/connect',
    syncUrl: '/api/integrations/facebook/sync',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Search, Display, and Performance Max',
    connectUrl: '/api/integrations/google/connect',
    syncUrl: '/api/integrations/google/sync',
    color: 'from-red-500 to-yellow-500',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'TikTok for Business campaigns',
    connectUrl: '/api/integrations/tiktok/connect',
    syncUrl: '/api/integrations/tiktok/sync',
    color: 'from-slate-900 to-pink-600',
  },
  {
    id: 'youtube',
    name: 'YouTube Ads',
    description: 'Video campaigns via Google Ads',
    connectUrl: '/api/integrations/youtube/connect',
    syncUrl: '/api/integrations/youtube/sync',
    color: 'from-red-600 to-red-800',
  },
] as const;

export function ConnectPlatformCard({
  platformId,
  connected,
  accountCount,
}: {
  platformId: string;
  connected: boolean;
  accountCount: number;
}) {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  if (!platform) return null;

  async function handleSync() {
    setSyncing(true);
    setMessage('');
    try {
      const res = await fetch(platform!.syncUrl, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      setMessage('Sync complete');
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <span
        className={`inline-block rounded-lg bg-gradient-to-r ${platform.color} px-2 py-1 text-xs font-semibold text-white mb-3`}
      >
        {platform.name}
      </span>
      <p className="text-sm text-slate-600">{platform.description}</p>

      {connected ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-emerald-700">
            Connected · {accountCount} account{accountCount !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
          <a
            href={platform.connectUrl}
            className="block text-center text-xs text-slate-500 hover:text-[#0072ff]"
          >
            Reconnect
          </a>
        </div>
      ) : (
        <a
          href={platform.connectUrl}
          className="mt-4 block w-full rounded-lg bg-gradient-to-r from-[#00c6ff] to-[#0072ff] px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
        >
          Connect
        </a>
      )}

      {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}
    </div>
  );
}
