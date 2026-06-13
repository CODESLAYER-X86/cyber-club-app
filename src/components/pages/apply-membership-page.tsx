'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hash, Building2, Phone, CreditCard, AlertCircle, Loader2, CheckCircle, FileText } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEPARTMENTS = [
  'Computer Science',
  'IT',
  'Electrical Engineering',
  'Software Engineering',
  'Cybersecurity',
  'Other',
];

export function ApplyMembershipPage() {
  const { currentUser, updateCurrentUser } = useAppStore();
  const [form, setForm] = useState({
    studentId: '',
    department: '',
    phone: '',
    transactionId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [membershipFee, setMembershipFee] = useState<number>(100);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.data) {
          setMembershipFee(data.data.membershipFee);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };
    fetchConfig();
  }, []);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.studentId.trim()) return 'Student ID is required';
    if (!form.department.trim()) return 'Department is required';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!form.transactionId.trim()) return 'Transaction ID is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        setSuccess(true);
        updateCurrentUser(data.data.user);
      } else {
        setError(data.error || 'Application failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success || currentUser?.membershipStatus === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
          <p className="mt-3 text-gray-400">
            Your membership application is currently pending review. You will be notified once approved by a verifier.
          </p>
        </motion.div>
      </div>
    );
  }

  if (currentUser?.membershipStatus === 'ACTIVE') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">You are already a Member!</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-emerald-400" />
          Apply for Membership
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Complete your profile and submit your membership fee to become an official member of the Cyber Security Club.
        </p>
      </div>

      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="pb-4 border-b border-white/5">
          <CardTitle className="text-lg font-medium text-white">Application Form</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </motion.div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">Student ID *</label>
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
                <label className="text-xs font-medium text-gray-400">Department *</label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Phone Number *</label>
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

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CreditCard className="h-4 w-4" /> Membership Fee: ৳{membershipFee}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Please pay via bKash/Nagad and enter your transaction ID below.
              </p>
              <div className="mt-4 relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={form.transactionId}
                  onChange={(e) => update('transactionId', e.target.value)}
                  placeholder="TXN-2025-XXXXX"
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
