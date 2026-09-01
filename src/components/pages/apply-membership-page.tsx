'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Building2,
  Phone,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileText,
  Copy,
  Check,
  Info,
  User,
  Smartphone,
  Landmark,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  sanitizePhone,
  isValidPhone,
  sanitizeStudentId,
  sanitizeRollNumber,
  sanitizeBatch,
  sanitizeTransactionId,
} from '@/lib/input-hardening';

const DEPARTMENTS = [
  // Science and Engineering
  'Computer Science and Engineering (CSE)',
  'Software Engineering (SWE)',
  'Electrical and Electronic Engineering (EEE)',
  'Information Technology (IT)',
  'Cyber Security (CYS)',
  'Civil Engineering',
  'Pharmacy',
  'Biochemistry and Molecular Biology',
  'Microbiology',
  // Arts and Social Sciences
  'English',
  'Economics',
  'Sociology',
  'Political Science',
  'Development Studies',
  // Business and Law
  'Business Administration (BBA)',
  'Law',
  'Other',
];

interface MembershipPaymentSettings {
  paymentRequired: boolean;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankAccount: string;
  paymentInstructions: string;
  contactPersonName: string;
  contactPersonPhone: string;
}

export function ApplyMembershipPage() {
  const { currentUser, updateCurrentUser, setCurrentView } = useAppStore();
  const [form, setForm] = useState({
    studentId: '',
    rollNumber: '',
    batch: '',
    department: '',
    phone: '',
    transactionId: '',
    paymentMethod: 'BKASH',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [membershipFee, setMembershipFee] = useState<number>(200);
  const [paymentSettings, setPaymentSettings] = useState<MembershipPaymentSettings>({
    paymentRequired: true,
    bkashNumber: '',
    nagadNumber: '',
    rocketNumber: '',
    bankAccount: '',
    paymentInstructions: '',
    contactPersonName: '',
    contactPersonPhone: '',
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.membershipFee) {
            setMembershipFee(data.data.membershipFee);
          }
          if (data.data.membershipPaymentSettings) {
            setPaymentSettings({
              paymentRequired: data.data.membershipPaymentSettings.paymentRequired ?? true,
              bkashNumber: data.data.membershipPaymentSettings.bkashNumber || '',
              nagadNumber: data.data.membershipPaymentSettings.nagadNumber || '',
              rocketNumber: data.data.membershipPaymentSettings.rocketNumber || '',
              bankAccount: data.data.membershipPaymentSettings.bankAccount || '',
              paymentInstructions: data.data.membershipPaymentSettings.paymentInstructions || '',
              contactPersonName: data.data.membershipPaymentSettings.contactPersonName || '',
              contactPersonPhone: data.data.membershipPaymentSettings.contactPersonPhone || '',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };
    fetchConfig();
  }, []);

  const copyToClipboard = (text: string, label: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: 'Copied to clipboard',
      description: `${label}: ${text}`,
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.studentId.trim()) return 'Registration ID / Student ID is required';
    if (!form.rollNumber.trim()) return 'Roll Number is required';
    if (!form.batch.trim()) return 'Batch is required';
    if (!form.department.trim()) return 'Department is required';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!isValidPhone(form.phone)) {
      return 'Please enter a valid phone number (digits only, e.g. 01XXXXXXXXX or +8801XXXXXXXXX)';
    }
    if (form.paymentMethod === 'CASH') {
      if (!form.transactionId.trim()) return 'Please enter the name of the person who received your cash';
    } else {
      if (!form.transactionId.trim()) return 'Transaction ID is required';
    }
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-md text-center rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">APPLICATION SUBMITTED</h2>
          <p className="mt-3 text-sm text-gray-300 leading-relaxed">
            Your membership application and payment record have been received and are pending executive verification.
          </p>
          <div className="mt-6 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300 font-mono">
            STATUS: PENDING_VERIFICATION
          </div>
          <Button
            onClick={() => setCurrentView('profile')}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono"
          >
            View Profile Status
          </Button>
        </motion.div>
      </div>
    );
  }

  if (currentUser?.membershipStatus === 'ACTIVE') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-md text-center rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">YOU ARE AN ACTIVE MEMBER</h2>
          <p className="mt-3 text-sm text-gray-400">
            You have full operative clearance and your digital badge is active.
          </p>
          <Button
            onClick={() => setCurrentView('profile')}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono"
          >
            Access Member Badge
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-8 backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <User className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white font-mono">SIGN IN TO APPLY</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Please sign in with your Google or student account first so we can link your official DIU Cyber Security Club membership and digital badge.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => setCurrentView('login')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm h-11"
            >
              Sign In to Continue ➔
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('register')}
              className="w-full border-white/10 text-gray-300 hover:text-white font-mono text-xs"
            >
              Create an Account
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active number based on selected payment method
  const getActiveMethodNumber = () => {
    switch (form.paymentMethod) {
      case 'BKASH':
        return paymentSettings.bkashNumber;
      case 'NAGAD':
        return paymentSettings.nagadNumber;
      case 'ROCKET':
        return paymentSettings.rocketNumber;
      case 'BANK':
        return paymentSettings.bankAccount;
      default:
        return '';
    }
  };

  const activeMethodNumber = getActiveMethodNumber();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
          <FileText className="h-6 w-6 text-emerald-400" />
          Enlist as Club Member
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Complete your academic registration and submit your membership fee to receive your official 3D Digital Member Identifier.
        </p>
      </div>

      {/* 1. PRESIDENT CONFIGURED PAYMENT INSTRUCTIONS & NUMBERS CARD */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-slate-950 via-[#071224] to-black backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-emerald-500/20 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-mono font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Membership Fee: <span className="text-emerald-300 font-black">৳{membershipFee}</span>
            </CardTitle>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-[11px]">
              OFFICIAL PAYMENT CHANNELS
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          {/* President's Custom Payment Instructions Box */}
          {paymentSettings.paymentInstructions ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <Info className="h-4 w-4 shrink-0" />
                Payment Instructions from Club Administration
              </div>
              <p className="text-xs text-gray-200 leading-relaxed pl-6 whitespace-pre-wrap font-sans">
                {paymentSettings.paymentInstructions}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400">
              Please send the exact membership fee of <strong>৳{membershipFee}</strong> via bKash, Nagad, Rocket, or Bank to the numbers below and enter the Transaction ID.
            </div>
          )}

          {/* MFS Payment Numbers Grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* bKash */}
            {paymentSettings.bkashNumber ? (
              <div className="rounded-xl border border-pink-500/30 bg-pink-950/10 p-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-pink-400 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> bKash (Personal)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentSettings.bkashNumber, 'bKash', 'bkash')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedKey === 'bkash' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="font-mono text-sm font-bold text-white tracking-wider">
                  {paymentSettings.bkashNumber}
                </p>
              </div>
            ) : null}

            {/* Nagad */}
            {paymentSettings.nagadNumber ? (
              <div className="rounded-xl border border-orange-500/30 bg-orange-950/10 p-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-orange-400 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> Nagad (Personal)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentSettings.nagadNumber, 'Nagad', 'nagad')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedKey === 'nagad' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="font-mono text-sm font-bold text-white tracking-wider">
                  {paymentSettings.nagadNumber}
                </p>
              </div>
            ) : null}

            {/* Rocket */}
            {paymentSettings.rocketNumber ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> Rocket
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentSettings.rocketNumber, 'Rocket', 'rocket')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedKey === 'rocket' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="font-mono text-sm font-bold text-white tracking-wider">
                  {paymentSettings.rocketNumber}
                </p>
              </div>
            ) : null}
          </div>

          {/* Bank Account (if configured) */}
          {paymentSettings.bankAccount && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5" /> Bank Account Details
                </span>
                <p className="font-mono text-xs text-gray-300">{paymentSettings.bankAccount}</p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(paymentSettings.bankAccount, 'Bank Account', 'bank')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copiedKey === 'bank' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Contact Person / Helpline */}
          {(paymentSettings.contactPersonName || paymentSettings.contactPersonPhone) && (
            <div className="flex flex-wrap items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-mono text-gray-400">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span>Contact Person: <strong className="text-white">{paymentSettings.contactPersonName || 'Club Executive'}</strong></span>
              </div>
              {paymentSettings.contactPersonPhone && (
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">{paymentSettings.contactPersonPhone}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. APPLICATION & ACADEMIC DATA FORM */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="pb-4 border-b border-white/5">
          <CardTitle className="text-lg font-medium text-white font-mono">
            Operative Academic Details
          </CardTitle>
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

            {/* Registration ID & Roll Number */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 font-mono">Registration ID / Student ID *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={form.studentId}
                    onChange={(e) => update('studentId', sanitizeStudentId(e.target.value))}
                    placeholder="e.g. 211-15-XXXX"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 font-mono">Roll Number *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={form.rollNumber}
                    onChange={(e) => update('rollNumber', sanitizeRollNumber(e.target.value))}
                    placeholder="e.g. 42"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Batch & Department */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 font-mono">Batch *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={form.batch}
                    onChange={(e) => update('batch', sanitizeBatch(e.target.value))}
                    placeholder="e.g. 62nd"
                    className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 font-mono">Department *</label>
                <Select value={form.department} onValueChange={(v) => update('department', v)}>
                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white focus:ring-emerald-500/20 text-sm">
                    <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111] text-white">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-white focus:bg-emerald-500/10 focus:text-emerald-400 text-sm">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 font-mono">Personal Contact Number (Phone) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={form.phone}
                  onChange={(e) => update('phone', sanitizePhone(e.target.value))}
                  placeholder="01XXXXXXXXX"
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono text-sm"
                />
              </div>
            </div>

            {/* Payment Method & Transaction ID */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">Payment Verification Detail</span>
                {activeMethodNumber && (
                  <span className="font-mono text-[11px] text-gray-300">
                    Send ৳{membershipFee} to: <strong className="text-emerald-300">{activeMethodNumber}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => update('paymentMethod', e.target.value)}
                    className="w-full h-10 px-2.5 rounded-md border border-white/10 bg-[#111] text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 text-xs font-mono focus:outline-none"
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">
                    {form.paymentMethod === 'CASH' ? 'Cash Received By (Person Name) *' : 'Transaction ID (TrxID) *'}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={form.transactionId}
                      onChange={(e) => update('transactionId', form.paymentMethod === 'CASH' ? e.target.value.slice(0, 50) : sanitizeTransactionId(e.target.value))}
                      placeholder={form.paymentMethod === 'CASH' ? 'e.g. OMAR / Handed to Executive' : 'e.g. BKX92849102'}
                      className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-emerald-500 text-slate-950 font-bold font-mono hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Application (৳{membershipFee})
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
