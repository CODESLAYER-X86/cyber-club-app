'use client';

import { useState } from 'react';
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

interface SessionItem {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const MOCK_SESSIONS: SessionItem[] = [
  {
    id: '1',
    device: 'Desktop',
    browser: 'Chrome 120',
    location: 'Dhaka, Bangladesh',
    lastActive: 'Now',
    isCurrent: true,
  },
  {
    id: '2',
    device: 'Mobile',
    browser: 'Safari 17',
    location: 'Dhaka, Bangladesh',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
  {
    id: '3',
    device: 'Desktop',
    browser: 'Firefox 121',
    location: 'Chittagong, Bangladesh',
    lastActive: '1 day ago',
    isCurrent: false,
  },
];

export function SettingsPage() {
  const { currentUser, updateCurrentUser, theme, setTheme, sidebarOpen, setSidebarOpen } = useAppStore();
  const { toast } = useToast();

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and application preferences</p>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={itemVariants}>
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
      <motion.div variants={itemVariants}>
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
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5">
                  {theme === 'dark' ? (
                    <Monitor className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-cyan-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Theme</p>
                  <p className="text-xs text-gray-500">Switch between dark and light mode</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-emerald-400')}>
                  Light
                </span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <span className={cn('text-xs', theme === 'dark' ? 'text-emerald-400' : 'text-gray-500')}>
                  Dark
                </span>
              </div>
            </div>

            <Separator className="bg-white/5" />

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
      <motion.div variants={itemVariants}>
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
      <motion.div variants={itemVariants}>
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
            {/* Change Password */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-200">Change Password</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: passwordStrength.width }}
                          className={cn('h-full rounded-full', passwordStrength.color)}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className={cn(
                        'text-[10px] font-medium',
                        passwordStrength.label === 'Weak' && 'text-red-400',
                        passwordStrength.label === 'Fair' && 'text-amber-400',
                        passwordStrength.label === 'Medium' && 'text-cyan-400',
                        passwordStrength.label === 'Strong' && 'text-emerald-400',
                      )}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400 text-xs">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword && confirmPassword !== newPassword && (
                    <p className="text-[10px] text-red-400">Passwords don&apos;t match</p>
                  )}
                  {confirmPassword && newPassword && confirmPassword === newPassword && (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </div>
            </div>

            <Separator className="bg-white/5" />

            {/* Two-Factor Auth */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5">
                  <Fingerprint className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            <Separator className="bg-white/5" />

            {/* Active Sessions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-200">Active Sessions</p>
              </div>
              <div className="space-y-2">
                {MOCK_SESSIONS.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md',
                        session.device === 'Desktop' ? 'bg-cyan-500/10' : 'bg-amber-500/10'
                      )}>
                        {session.device === 'Desktop' ? (
                          <Monitor className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-200">{session.browser}</p>
                          {session.isCurrent && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {session.location} &middot; {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
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


