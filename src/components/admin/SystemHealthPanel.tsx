'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Database, HardDrive, ShieldCheck, Server } from 'lucide-react';
import adminApi from '@/lib/adminApi';

interface SystemHealthData {
  database: { status: 'ok' | 'error'; latency_ms: number | null; driver: string; error?: string | null };
  storage: { status: 'ok' | 'error'; driver: string; error?: string | null };
  backup: { last_backup: { file: string; size: number; timestamp: string } | null; scheduled: boolean };
  queue: { failed_jobs: number };
  environment: { php_version: string; laravel_version: string; app_env: string; server_time: string };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SystemHealthPanel() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/admin/system-health');
      setHealth(res.data.data);
    } catch {
      setError('Unable to fetch system health status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (error && !health) {
    return (
      <div className="border border-rose-200 bg-rose-50 p-4 rounded-xl text-sm text-rose-800 flex items-center justify-between">
        <span>{error}</span>
        <button type="button" onClick={fetchHealth} className="underline text-xs font-semibold cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  const isDbHealthy = health?.database.status === 'ok';
  const isStorageHealthy = health?.storage.status === 'ok';

  return (
    <section className="border border-line bg-surface rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-taupe" />
          <h2 className="text-base font-semibold text-ink">System Performance &amp; Health</h2>
        </div>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          className="touch-target-44 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Refresh health metrics"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Database */}
        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Database size={13} /> Database
            </span>
            {isDbHealthy ? (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> {health?.database.latency_ms ?? 0} ms
              </span>
            ) : (
              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <AlertTriangle size={11} /> Offline
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-ink capitalize">{health?.database.driver ?? 'MySQL'}</p>
          <p className="text-xs text-ink-faint font-normal">{isDbHealthy ? 'Connected & responding' : health?.database.error ?? 'Unreachable'}</p>
        </div>

        {/* File Storage */}
        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive size={13} /> Storage
            </span>
            {isStorageHealthy ? (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> Ready
              </span>
            ) : (
              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                <AlertTriangle size={11} /> Error
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-ink capitalize">{health?.storage.driver ?? 'Disk'}</p>
          <p className="text-xs text-ink-faint font-normal">{isStorageHealthy ? 'Read/write operational' : health?.storage.error ?? 'Write error'}</p>
        </div>

        {/* Backup */}
        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={13} /> Daily Backup
            </span>
            <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px] font-medium">Scheduled</span>
          </div>
          <p className="text-sm font-semibold text-ink truncate">
            {health?.backup.last_backup ? formatBytes(health.backup.last_backup.size) : 'No snapshot yet'}
          </p>
          <p className="text-xs text-ink-faint font-normal truncate">
            {health?.backup.last_backup ? new Date(health.backup.last_backup.timestamp).toLocaleDateString() : 'Runs daily via cron'}
          </p>
        </div>

        {/* Server Runtime */}
        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Server size={13} /> Engine
            </span>
            <span className="text-ink-muted bg-sunken px-1.5 py-0.5 rounded text-[10px] font-mono">{health?.environment.app_env ?? 'prod'}</span>
          </div>
          <p className="text-sm font-semibold text-ink">PHP {health?.environment.php_version?.split('-')[0]} · L{health?.environment.laravel_version}</p>
          <p className="text-xs text-ink-faint font-normal">{health?.queue.failed_jobs ?? 0} failed queue jobs</p>
        </div>
      </div>
    </section>
  );
}
