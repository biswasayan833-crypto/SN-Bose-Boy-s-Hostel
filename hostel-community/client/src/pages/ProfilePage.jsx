import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  KeyRound,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  MessageSquare,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import profileService from '../services/profileService';
import AvatarPicker, { PREDEFINED_AVATARS } from '../components/AvatarPicker';
import NotificationDropdown from '../components/NotificationDropdown';

export const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile data state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Identity Form State
  const [anonymousName, setAnonymousName] = useState('');
  const [anonymousAvatar, setAnonymousAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityError, setIdentityError] = useState('');
  const [identitySuccess, setIdentitySuccess] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch private profile on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setFetchError('');
        const res = await profileService.getMyProfile();
        if (res?.data?.profile) {
          const p = res.data.profile;
          setProfile(p);
          setAnonymousName(p.anonymousName || '');
          setAnonymousAvatar(p.anonymousAvatar || 'avatar-01');
          setBio(p.bio || '');
        }
      } catch (err) {
        setFetchError(err.message || 'Failed to retrieve profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Helper to render avatar icon preview
  const getAvatarDisplay = (avatarKey) => {
    const match = PREDEFINED_AVATARS.find(
      (a) => a.id === avatarKey || a.icon === avatarKey
    );
    return match ? match.icon : avatarKey || '🎭';
  };

  // Handle Identity Update
  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setIdentityError('');
    setIdentitySuccess('');

    // Client-side validations
    const trimmedName = anonymousName.trim();
    if (!trimmedName) {
      setIdentityError('Anonymous pseudonym is required.');
      return;
    }
    if (trimmedName.length < 3 || trimmedName.length > 30) {
      setIdentityError('Anonymous name must be between 3 and 30 characters.');
      return;
    }
    if (/[<>]/.test(trimmedName)) {
      setIdentityError('Anonymous name cannot contain HTML or angle brackets.');
      return;
    }
    if (bio && bio.length > 160) {
      setIdentityError('Bio cannot exceed 160 characters.');
      return;
    }

    try {
      setIdentitySaving(true);
      const res = await profileService.updateMyProfile({
        anonymousName: trimmedName,
        anonymousAvatar,
        bio: bio.trim(),
      });

      if (res?.data?.profile) {
        setProfile(res.data.profile);
        // Update global AuthContext user immediately
        updateUser(res.data.user || res.data.profile);
        setIdentitySuccess('Community identity updated successfully!');
        setTimeout(() => setIdentitySuccess(''), 4000);
      }
    } catch (err) {
      setIdentityError(err.message || 'Failed to update community identity.');
    } finally {
      setIdentitySaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await profileService.changeMyPassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(res?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#080b12]/95 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-semibold hidden sm:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Profile & Identity Settings
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown />

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Loading profile and identity details...</p>
          </div>
        )}

        {/* Global Fetch Error */}
        {fetchError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {!loading && profile && (
          <>
            {/* 1. Community Identity Showcase Card */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/90 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[2px] shadow-xl shadow-indigo-600/30 flex-shrink-0">
                    <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center text-4xl">
                      {getAvatarDisplay(profile.anonymousAvatar)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
                        Community Identity
                      </span>
                      <span className="text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        ● Live
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {profile.anonymousName}
                    </h2>

                    <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                      <span className="text-cyan-300 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {profile.year}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        Prof. S.N. Bose Boys Hostel
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:max-w-xs text-left sm:text-right space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 font-medium">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Public Persona</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This is the identity other students see in community rooms.
                  </p>
                </div>
              </div>

              {profile.bio && (
                <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-slate-300 italic">
                  "{profile.bio}"
                </div>
              )}
            </section>

            {/* 2. Account Information (Private To Logged-In User) */}
            <section className="rounded-3xl bg-slate-900/50 border border-white/[0.08] p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Private Account Information</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your real name and email are not displayed to other students in the community.
                  </p>
                </div>

                <span className="hidden sm:inline-block text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                  Owner View Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Real Full Name
                  </span>
                  <div className="text-sm font-semibold text-white truncate">
                    {profile.fullName}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Hidden from peers)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Registered Email
                  </span>
                  <div className="text-sm font-semibold text-white truncate">
                    {profile.email}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Hidden from peers)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Verified Academic Year
                  </span>
                  <div className="text-sm font-semibold text-white">
                    {profile.year}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Hostel partitioned)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Platform Role
                  </span>
                  <div className="text-sm font-semibold text-indigo-300 capitalize">
                    {profile.role}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Access permissions)
                  </span>
                </div>
              </div>
            </section>

            {/* 3. Edit Community Identity Form */}
            <section className="rounded-3xl bg-slate-900/50 border border-white/[0.08] p-6 sm:p-7 space-y-6">
              <div className="space-y-1 border-b border-white/[0.06] pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Customize Community Identity</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update your anonymous display persona. Future messages and community interactions will use this identity.
                </p>
              </div>

              {identityError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{identityError}</span>
                </div>
              )}

              {identitySuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{identitySuccess}</span>
                </div>
              )}

              <form onSubmit={handleIdentitySubmit} className="space-y-6">
                {/* Anonymous Name Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="anonymousName"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Anonymous Pseudonym <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {anonymousName.length}/30 characters
                    </span>
                  </div>
                  <input
                    id="anonymousName"
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    value={anonymousName}
                    onChange={(e) => setAnonymousName(e.target.value)}
                    placeholder="e.g. MidnightFalcon"
                    className="w-full px-4 py-3 rounded-xl bg-[#090d16] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400">
                    Must be 3–30 characters. Do not use real personal names or reserved administrative titles.
                  </p>
                </div>

                {/* Avatar Picker */}
                <AvatarPicker
                  selectedAvatar={anonymousAvatar}
                  onSelect={(avId) => setAnonymousAvatar(avId)}
                />

                {/* Bio (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="bio"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Community Bio <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      {bio.length}/160 characters
                    </span>
                  </div>
                  <textarea
                    id="bio"
                    rows={3}
                    maxLength={160}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a short note about your tech interests, hobbies, or hostel life..."
                    className="w-full px-4 py-3 rounded-xl bg-[#090d16] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={identitySaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{identitySaving ? 'Saving Changes...' : 'Save Identity'}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* 4. Password & Security Form */}
            <section className="rounded-3xl bg-slate-900/50 border border-white/[0.08] p-6 sm:p-7 space-y-6">
              <div className="space-y-1 border-b border-white/[0.06] pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Password & Security</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update your authentication password. Passwords are securely hashed with bcrypt.
                </p>
              </div>

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="currentPassword"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Current Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="newPassword"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      New Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Confirm New Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs transition-all disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{passwordSaving ? 'Updating Password...' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
