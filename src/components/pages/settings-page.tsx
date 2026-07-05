'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Palette,
  Bell,
  Shield,
  AlertTriangle,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Globe,
  Key,
  Fingerprint,
  Download,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};



export function SettingsPage() {
  const { currentUser, updateCurrentUser, theme, setTheme, sidebarOpen, setSidebarOpen } = useAppStore();
  const { toast } = useToast();

  // Club settings state (only for President)
  const [membershipFee, setMembershipFee] = useState<number | string>('');
  const [defaultPrimaryColor, setDefaultPrimaryColor] = useState('#10b981');
  const [defaultSecondaryColor, setDefaultSecondaryColor] = useState('#06b6d4');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'PRESIDENT' || currentUser?.role === 'PLATFORM_ADMIN') {
      const fetchConfig = async () => {
        try {
          const res = await fetch('/api/config');
          const data = await res.json();
          if (data.success && data.data) {
            setMembershipFee(data.data.membershipFee);
            setDefaultPrimaryColor(data.data.defaultPrimaryColor || '#10b981');
            setDefaultSecondaryColor(data.data.defaultSecondaryColor || '#06b6d4');
          }
        } catch (error) {
          console.error('Failed to fetch config:', error);
        }
      };
      fetchConfig();
    }
  }, [currentUser]);

  // Profile form state
  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Notification toggles (visual only)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Password strength
  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (pwd.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const strength = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength >= 2) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    return { label: 'Medium', color: 'bg-cyan-500', width: '75%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, bio }),
      });
      const data = await res.json();
      if (data.success) {
        updateCurrentUser(data.data.user || data.data);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been saved successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update profile.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'New password and confirmation must match.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    setIsChangingPassword(true);
    // Simulate API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
    }, 1500);
  };

  const handleExportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your data export will be ready shortly. You\'ll receive an email when it\'s done.',
    });
  };

  const handleSaveClubSettings = async () => {
    const feeNum = parseFloat(membershipFee as string);
    if (isNaN(feeNum) || feeNum < 100 || feeNum > 1000) {
      toast({
        title: 'Invalid Fee',
        description: 'Membership fee must be a number between 100 and 1000.',
        variant: 'destructive',
      });
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(defaultPrimaryColor) || !/^#[0-9A-Fa-f]{6}$/.test(defaultSecondaryColor)) {
      toast({
        title: 'Invalid Colors',
        description: 'Colors must be valid hex codes (e.g. #10b981).',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipFee: feeNum,
          defaultPrimaryColor,
          defaultSecondaryColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Settings Saved',
          description: 'Club configuration updated successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save settings.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants as any}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants as any} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and application preferences</p>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={itemVariants as any}>
        <Card className="border-white/5 bg-[#111] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <User className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-500">Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Info Display */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                {currentUser?.role || 'Member'}
              </Badge>
              <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-500/5">
                {currentUser?.email}
              </Badge>
              {currentUser?.department && (
                <Badge variant="outline" className="border-white/10 text-gray-400 bg-white/5">
                  {currentUser.department}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 min-h-[80px]"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance Section */}
      <motion.div variants={itemVariants as any}>
        <Card className="border-white/5 bg-[#111] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-emerald-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Palette className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-white">Appearance</CardTitle>
                <CardDescription className="text-gray-500">Customize how the app looks and feels</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">


            {/* Sidebar Default State */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5">
                  <Globe className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Sidebar Default</p>
                  <p className="text-xs text-gray-500">Choose sidebar default state</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-xs', sidebarOpen ? 'text-gray-500' : 'text-emerald-400')}>
                  Collapsed
                </span>
                <Switch
                  checked={sidebarOpen}
                  onCheckedChange={(checked) => setSidebarOpen(checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <span className={cn('text-xs', sidebarOpen ? 'text-emerald-400' : 'text-gray-500')}>
                  Expanded
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div variants={itemVariants as any}>
        <Card className="border-white/5 bg-[#111] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-emerald-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Bell className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-gray-500">Configure how you receive notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive event and update emails</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Push Notifications</p>
                <p className="text-xs text-gray-500">Get instant browser notifications</p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* Notification Sound */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Notification Sound</p>
                <p className="text-xs text-gray-500">Play a sound for new notifications</p>
              </div>
              <Switch
                checked={notificationSound}
                onCheckedChange={setNotificationSound}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Section */}
      <motion.div variants={itemVariants as any}>
        <Card className="border-white/5 bg-[#111] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-amber-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white">Security</CardTitle>
                <CardDescription className="text-gray-500">Manage your account security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google OAuth Notice */}
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-300">Secured with Google OAuth</p>
                <p className="text-xs text-gray-500 mt-0.5">Your account is protected by Google&apos;s authentication. Passwords and 2FA are managed directly through your Google account settings.</p>
              </div>
            </div>


          </CardContent>
        </Card>
      </motion.div>

      {/* Club Settings (President & Admin Only) */}
      {(currentUser?.role === 'PRESIDENT' || currentUser?.role === 'PLATFORM_ADMIN') && (
        <motion.div variants={itemVariants as any}>
          <Card className="border-white/5 bg-[#111] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Club Settings</CardTitle>
                  <CardDescription className="text-gray-500">Manage club-wide global configurations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="membershipFee" className="text-gray-400">Membership Fee (৳)</Label>
                <div className="flex gap-3 max-w-md">
                  <Input
                    id="membershipFee"
                    type="number"
                    min="100"
                    max="1000"
                    placeholder="100"
                    value={membershipFee}
                    onChange={(e) => setMembershipFee(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <p className="text-[11px] text-gray-600">The membership fee must be between ৳100 and ৳1000. Changes will apply immediately to new applicants.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">Default Certificate Primary Color</Label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="color"
                      value={defaultPrimaryColor}
                      onChange={(e) => setDefaultPrimaryColor(e.target.value)}
                      className="h-10 w-10 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                    />
                    <Input
                      value={defaultPrimaryColor}
                      onChange={(e) => setDefaultPrimaryColor(e.target.value)}
                      placeholder="#10b981"
                      className="border-white/10 bg-white/5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400">Default Certificate Secondary Color</Label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="color"
                      value={defaultSecondaryColor}
                      onChange={(e) => setDefaultSecondaryColor(e.target.value)}
                      className="h-10 w-10 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
                    />
                    <Input
                      value={defaultSecondaryColor}
                      onChange={(e) => setDefaultSecondaryColor(e.target.value)}
                      placeholder="#06b6d4"
                      className="border-white/10 bg-white/5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveClubSettings}
                  disabled={isSavingConfig}
                  className="bg-amber-600 text-white hover:bg-amber-500 gap-2"
                >
                  {isSavingConfig ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div variants={itemVariants as any}>
        <Card className="border-red-500/20 bg-[#111] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-white">Danger Zone</CardTitle>
                <CardDescription className="text-gray-500">Irreversible and destructive actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Export Your Data</p>
                <p className="text-xs text-gray-500">Download a copy of all your data</p>
              </div>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            <Separator className="bg-white/5" />

            {/* Deactivate Account */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">Deactivate Account</p>
                <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-white/10 bg-[#111] text-gray-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Deactivate Account
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This action cannot be undone. This will permanently delete your account and remove all of your data from our servers, including events, certificates, and payment history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        toast({
                          title: 'Feature Disabled',
                          description: 'Account deactivation is not available in the demo.',
                        });
                      }}
                      className="bg-red-600 text-white hover:bg-red-500"
                    >
                      Yes, deactivate my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}


