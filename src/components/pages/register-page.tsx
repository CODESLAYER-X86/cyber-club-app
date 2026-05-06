'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, UserPlus, Mail, Lock, Hash, Building2, Phone, CreditCard, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', studentId: '', department: '', phone: '', transactionId: '', password: '', confirmPassword: '' });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { setCurrentView } = useAppStore();

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (!terms) { setError('You must accept the terms'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'GUEST', membershipStatus: 'PENDING' }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); } else { setError(data.error || 'Registration failed'); }
    } catch { setError('Network error'); } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Submitted!</h2>
          <p className="mt-2 text-gray-400">Your membership application is pending review. You will be notified once approved.</p>
          <Button onClick={() => setCurrentView('login')} className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">Go to Login</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-emerald-500/6 blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <UserPlus className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join CyberSec Club</h1>
          <p className="mt-1 text-sm text-gray-500">Start your cybersecurity journey with us</p>
        </div>

        <Card className="border-white/10 bg-[#111]/80 backdrop-blur-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Full Name *</label>
                  <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Doe" required className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Email *</label>
                  <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@university.edu" required className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Student ID</label>
                  <Input value={form.studentId} onChange={(e) => update('studentId', e.target.value)} placeholder="CS2024001" className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Department</label>
                  <Input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Computer Science" className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Phone</label>
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+880 1XXX-XXXXXX" className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400"><CreditCard className="h-4 w-4" /> Membership Fee: ৳500</div>
                <p className="mt-1 text-xs text-gray-500">Pay via bKash/Nagad and enter your transaction ID below</p>
                <Input value={form.transactionId} onChange={(e) => update('transactionId', e.target.value)} placeholder="TXN-2025-XXXXX" className="mt-3 border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Password *</label>
                  <Input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" required className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Confirm Password *</label>
                  <Input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" required className="border-white/10 bg-white/5 text-white placeholder:text-gray-600" />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5 border-white/20" />
                <label htmlFor="terms" className="text-xs text-gray-400">I agree to the club&apos;s terms and conditions and code of conduct</label>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Submit Application
              </Button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button onClick={() => setCurrentView('login')} className="text-emerald-400 hover:text-emerald-300">Sign In</button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
