"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navigation, Clock3, ArrowLeft } from 'lucide-react';
import { type HistoryNavigationItem } from '@/lib/historyNavigation';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryNavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      try {
        const response = await fetch('/api/history/navigation');
        if (response.status === 401) {
          setUnauthorized(true);
          setItems([]);
          return;
        }

        const data = (await response.json().catch(() => ({}))) as {
          items?: HistoryNavigationItem[];
          error?: string;
        };

        if (!response.ok) {
          setError(data.error || '讀取歷史失敗');
          return;
        }

        setItems(data.items || []);
      } catch {
        setError('讀取歷史失敗');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-gray-500">載入中...</p>;
    }

    if (unauthorized) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 space-y-3">
          <p>需要先登入才能查看導航歷史紀錄。</p>
          <Link href="/signin" className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-white">
            前往登入
          </Link>
        </div>
      );
    }

    if (error) {
      return <p className="text-sm text-red-500">{error}</p>;
    }

    if (items.length === 0) {
      return <p className="text-sm text-gray-500">目前沒有導航紀錄。</p>;
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-800">{item.restaurantName}</h2>
                <p className="text-xs text-gray-500 mt-1">第 {item.rank} 名推薦</p>
              </div>
              <a
                href={item.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600"
              >
                <Navigation size={14} />
                導航
              </a>
            </div>

            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p className="inline-flex items-center gap-1">
                <Clock3 size={13} />
                {new Date(item.pickedAt).toLocaleString('zh-TW')}
              </p>
              {item.distanceKm !== undefined && <p>距離：約 {item.distanceKm} km</p>}
              {item.rating !== undefined && <p>評分：{item.rating}</p>}
              {item.address && <p className="truncate">地址：{item.address}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }, [error, items, loading, unauthorized]);

  return (
    <main className="h-full w-full bg-slate-50 p-6 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">歷史推薦紀錄</h1>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500">
          <ArrowLeft size={14} />
          回首頁
        </Link>
      </div>
      {content}
    </main>
  );
}
