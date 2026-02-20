"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || '註冊失敗');
      return;
    }

    await signIn('credentials', { email, password, redirect: false });
    window.location.href = '/';
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 bg-slate-50">
      <h1 className="text-2xl font-bold mb-6">註冊 Eat What</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg">
          註冊
        </button>
      </form>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <Link href="/signin" className="text-blue-600">
          已有帳號？登入
        </Link>
        <Link href="/" className="text-gray-500">
          回首頁
        </Link>
      </div>
    </div>
  );
}
