"use client";

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError('登入失敗，請確認帳號密碼');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6">
      <h1 className="text-2xl font-bold mb-6">登入 Eat What</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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
          登入
        </button>
      </form>
    </div>
  );
}
