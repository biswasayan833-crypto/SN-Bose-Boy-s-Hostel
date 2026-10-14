import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { CinematicBackground } from '../components/ui/CinematicBackground';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyOtp, resendOtp, isAuthenticated } = useAuth();

  // Step 1: Credentials
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2: 2FA / OTP Verification
  const [requires2FA, setRequires2FA] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status Alerts
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  // 30-second cooldown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errorMessage) setErrorMessage('');
  };

  // Step 1 Submit: Check credentials and initiate 2FA
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!formData.password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const userEmail = res?.data?.email || formData.email.trim();
      if (res?.data?.requires2FA || res?.requires2FA) {
        setTargetEmail(userEmail);
        setRequires2FA(true);
        setOtp('');
        setResendCooldown(30); // 30-second cooldown
        setInfoMessage(res?.data?.message || res?.message || 'Verification code sent to your email.');
      } else if (res?.data?.token) {
        // Direct login fallback if 2FA wasn't triggered
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit: Validate OTP and finalize authentication
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    try {
      setOtpLoading(true);
      await verifyOtp(targetEmail, cleanOtp);

      // Once verified, isAuthenticated will become true and trigger redirect
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP code with 30s cooldown
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setErrorMessage('');
    setInfoMessage('');

    try {
      setResendLoading(true);
      const res = await resendOtp(targetEmail);
      setResendCooldown(30);
      setInfoMessage(res?.data?.message || res?.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Back to Step 1
  const handleBackToLogin = () => {
    setRequires2FA(false);
    setOtp('');
    setErrorMessage('');
    setInfoMessage('');
  };

  return (
    <div
      id="login-page-wrapper"
      className="login-page-wrapper relative min-h-screen w-screen overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200"
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <CinematicBackground
        enableVideo={!isAuthenticated}
        className="justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500/30 selection:text-indigo-200"
        style={{
          minHeight: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0 my-auto">
          {/* Brand logo & title */}
          <div className="text-center space-y-3 animate-slide-down">
            <Link to="/" className="inline-flex items-center gap-2.5 group focus-ring rounded-xl">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-600/25">
                <div className="w-full h-full bg-[#080d19] rounded-[11px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-left">
                <span className="font-bold text-lg text-white block">Prof. S.N. Bose</span>
                <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block">
                  Boys Hostel Community
                </span>
              </div>
            </Link>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {requires2FA ? 'Enter Verification Code' : 'Sign In to the Community'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {requires2FA
                ? 'Two-factor authentication code sent to your email'
                : 'Enter your credentials to access hostel channels'}
            </p>
          </div>

          {/* Card Form */}
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up stagger-1">
            <GlassCard variant="elevated" glow={true} className="py-7 px-4 sm:px-8 md:px-10 shadow-2xl space-y-6">
              
              {/* Info alert */}
              {infoMessage && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Error alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 2: 2FA OTP Form */}
              {requires2FA ? (
                <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in fade-in">
                  {/* Target email badge */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] text-xs text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[11px] text-slate-400 font-medium">Verification code sent to</span>
                      <span className="font-semibold text-white truncate block">{targetEmail}</span>
                    </div>
                  </div>

                  {/* 6-digit OTP input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      6-Digit Security Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        id="otp-input"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        required
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(val);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="000000"
                        className="input-cinema pl-10 text-center tracking-[0.45em] font-mono text-xl font-bold placeholder:tracking-normal"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">
                      Code expires in 10 minutes
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={otpLoading || otp.length !== 6}
                      className="btn-cinema-primary w-full min-h-[46px] py-3 px-4 text-sm justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Verifying & Signing In...</span>
                        </span>
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions: Back & Resend */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Login</span>
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || resendLoading}
                      onClick={handleResendOtp}
                      className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {resendLoading ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                          <span>Sending...</span>
                        </span>
                      ) : resendCooldown > 0 ? (
                        <span>Resend in {resendCooldown}s</span>
                      ) : (
                        <span>Resend Code</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 1: Credentials Form */
                <>
                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="student@college.edu"
                          className="input-cinema pl-10"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className="input-cinema pl-10 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute inset-y-0 right-0 w-11 h-full flex items-center justify-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-cinema-primary w-full min-h-[46px] py-3 px-4 text-sm justify-center shadow-lg"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>Authenticating...</span>
                          </span>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Switch to Register */}
                  <div className="pt-4 border-t border-white/[0.08] text-center text-xs text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                      Join the community
                    </Link>
                  </div>
                </>
              )}
            </GlassCard>

            {/* Return to Home link */}
            <div className="mt-6 text-center">
              <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                ← Return to Hostel Home
              </Link>
            </div>
          </div>
        </div>
      </CinematicBackground>
    </div>
  );
};

export default Login;
