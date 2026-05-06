'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';

const DEMO_ACCOUNTS = [
  { label: 'President', email: 'president@cybersecclub.com', password: 'president123', color: 'text-amber-400' },
  { label: 'Treasurer', email: 'treasurer@cybersecclub.com', password: 'treasurer123', color: 'text-emerald-400' },
  { label: 'Media', email: 'media@cybersecclub.com', password: 'media123', color: 'text-pink-400' },
  { label: 'Member', email: 'member1@university.edu', password: 'member123', color: 'text-cyan-400' },
  { label: 'Guest', email: 'guest@university.edu', password: 'guest123', color: 'text-gray-400' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, setCurrentView } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        login(data.data.user || data.data);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        login(data.data.user || data.data);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/6 blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Shield className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to CyberSec Club Platform</p>
        </div>

        <Card className="border-white/10 bg-[#111]/80 backdrop-blur-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <span className="relative bg-[#111] px-3 text-xs text-gray-500">Quick Demo Login</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button key={acc.label} onClick={() => quickLogin(acc)} className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-white/5 px-2 py-2 text-[10px] font-medium transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10">
                    <span className={acc.color}>{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Don&apos;t have an account?{' '}
              <button onClick={() => setCurrentView('register')} className="text-emerald-400 hover:text-emerald-300">Register</button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
