import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, GraduationCap, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    year: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!formData.year) {
      setErrorMessage('Please select your academic year (2nd, 3rd, or 4th Year).');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and try again.');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        year: formData.year,
      });

      // Redirect to authenticated community dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/10 to-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand logo & title */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-600/25">
              <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
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
            Create Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Exclusive private platform for hostel residents
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#0c101d]/90 backdrop-blur-xl py-8 px-5 sm:px-10 border border-white/[0.08] rounded-3xl shadow-2xl space-y-6">
            
            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Privacy Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-white">Privacy Notice:</strong> Your real name is used for your account, but it is not displayed to other students in the community.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Ayan Biswas"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institutional / Student Email
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Year Dropdown (ONLY 2nd, 3rd, 4th Year - NO 1st Year) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white transition-colors"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">
                      Select your hostel year
                    </option>
                    <option value="2nd Year" className="bg-slate-900 text-white">
                      2nd Year
                    </option>
                    <option value="3rd Year" className="bg-slate-900 text-white">
                      3rd Year
                    </option>
                    <option value="4th Year" className="bg-slate-900 text-white">
                      4th Year
                    </option>
                  </select>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Prof. S.N. Bose Boys Hostel accommodates 2nd, 3rd, and 4th Year students.
                </span>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Creating Account & Anonymous Persona...</span>
                    </span>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Switch to Login Link */}
            <div className="pt-4 border-t border-white/[0.08] text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </div>

          </div>

          {/* Return to Home link */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Return to Hostel Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
