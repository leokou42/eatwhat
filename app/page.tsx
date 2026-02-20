"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { History, Settings, LogIn, Sparkles, User } from 'lucide-react';

const entries = [
  {
    href: '/recommend',
    title: '進行餐廳推薦',
    description: '透過問答快速找到適合今天的餐廳',
    icon: Sparkles,
    iconClass: 'text-orange-600 bg-orange-100',
  },
  {
    href: '/history',
    title: '歷史推薦紀錄',
    description: '查看你曾經按下 Google Maps 導航的餐廳',
    icon: History,
    iconClass: 'text-blue-600 bg-blue-100',
  },
  {
    href: '/settings',
    title: '設定',
    description: '調整 theme、model、題目長度與搜尋半徑',
    icon: Settings,
    iconClass: 'text-slate-700 bg-slate-100',
  },
  {
    href: '/signin',
    title: '登入 / 帳號',
    description: '登入後可同步偏好設定與導航歷史',
    icon: LogIn,
    iconClass: 'text-green-600 bg-green-100',
  },
] as const;

export default function LauncherPage() {
  const { data, status } = useSession();

  return (
    <main className="h-full w-full bg-slate-50 p-6 overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          Eat What
        </h1>
        <p className="text-sm text-gray-500 mt-1">選擇你要使用的功能</p>
        <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 text-center">
          {status === 'authenticated' ? (
            <span className="inline-flex items-center justify-center gap-2 w-full">
              <User size={14} className="text-gray-400" />
              {data.user?.name || data.user?.email || '已登入'}
            </span>
          ) : (
            '目前為訪客模式'
          )}
        </div>
      </header>

      <div className="space-y-3 pb-6">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className="block rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${entry.iconClass}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{entry.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{entry.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
