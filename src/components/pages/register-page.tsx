'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, UserPlus, Mail, Lock, Hash, Building2, Phone, CreditCard, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEPARTMENTS = [
  'Computer Science',
  'IT',
  'Electrical Engineering',
  'Software Engineering',
  'Cybersecurity',
  'Other',
];

function getPasswordStrength(password: string): { label: string; color: string; percent: number } {
  if (!password) return { label: '', color: '', percent: 0 };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', percent: 33 };
  if (score <= 3) return { label: 'Medium', color: 'bg-amber-500', percent: 66 };
  return { label: 'Strong', color: 'bg-emerald-500', percent: 100 };
}

export function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    phone: '',
    transactionId: '',
    password: '',
    confirmPassword: '',
  });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setCurrentView } = useAppStore();

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address';
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!terms) return 'You must accept the terms and conditions';
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          studentId: form.studentId,
          department: form.department,
          phone: form.phone,
          transactionId: form.transactionId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-emerald-500/6 blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative z-10 max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10"
          >
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            Registration Submitted!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-gray-400"
          >
            Your membership application is pending review. You will be notified once approved by an administrator.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <p className="text-xs text-emerald-400">
              You can log in once your membership is approved.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={() => setCurrentView('login')}
              className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
            >
              Go to Login
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-emerald-500/6 blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </motion.div>
              )}

              {/* Full Name & Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Full Name *</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="John Doe"
                      required
                      className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@university.edu"
                      required
                      className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Student ID & Department */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Student ID</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={form.studentId}
                      onChange={(e) => update('studentId', e.target.value)}
                      placeholder="CS2024001"
                      className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Department</label>
                  <Select value={form.department} onValueChange={(v) => update('department', v)}>
                    <SelectTrigger className="w-full border-white/10 bg-white/5 text-white focus:ring-emerald-500/20">
                      <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#111] text-white">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-white focus:bg-emerald-500/10 focus:text-emerald-400">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CreditCard className="h-4 w-4" /> Membership Fee: ৳500
                </div>
                <p className="mt-1 text-xs text-gray-500">Pay via bKash/Nagad and enter your transaction ID below</p>
                <div className="mt-3 relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={form.transactionId}
                    onChange={(e) => update('transactionId', e.target.value)}
                    placeholder="TXN-2025-XXXXX"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="••••••••"
                      required
                      className="border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {form.password && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength.percent}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full rounded-full ${passwordStrength.color}`}
                        />
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength.label === 'Weak' ? 'text-red-400' :
                        passwordStrength.label === 'Medium' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                      className="border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                    <p className="text-xs text-emerald-400">Passwords match</p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5 border-white/20" />
                <label htmlFor="terms" className="text-xs text-gray-400">
                  I agree to the club&apos;s terms and conditions and code of conduct
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Submit Application
              </Button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button onClick={() => setCurrentView('login')} className="text-emerald-400 hover:text-emerald-300">
                  Sign In
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
