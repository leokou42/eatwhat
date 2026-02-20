"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';

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
    <div className="flex-1 flex flex-col justify-center items-center px-6">
      <h1 className="text-2xl font-bold mb-6">註冊 Eat What</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg">
          註冊
        </button>
      </form>
    </div>
  );
}
