import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, Server, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useAuth } from '../context/AuthContext';

export const JoinModal = ({ isOpen, onClose, selectedRoom }) => {
  const { online, data, refetch } = useHealthCheck();
  const { isAuthenticated } = useAuth();
  const [testingPing, setTestingPing] = useState(false);

  if (!isOpen) return null;


  const handleTestPing = async () => {
    setTestingPing(true);
    await refetch();
    setTimeout(() => setTestingPing(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0c101d] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {selectedRoom ? `Access ${selectedRoom.name}` : 'Community Gateway'}
              </h3>
              <p className="text-xs text-slate-400">
                Prof. S.N. Bose Boys Hostel Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development Status Notice */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Task 2 Auth & Identity System Active
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {online ? '✓ API Online' : 'Connecting'}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            The authentication and anonymous identity foundation for <strong>Prof. S.N. Bose Boys Hostel</strong> is live! You can create a student account (2nd, 3rd, or 4th Year) and receive your masked community persona.
          </p>
        </div>

        {/* Live Backend Health Diagnostic */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/[0.06] p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium font-mono">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Backend Health Status (/api/health)</span>
            </div>
            <button
              onClick={handleTestPing}
              disabled={testingPing}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
            >
              {testingPing ? 'Pinging...' : 'Ping Endpoint'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-slate-500 block">Service:</span>
              <span className="text-slate-200 truncate block">
                {data?.service || 'Prof. S.N. Bose API'}
              </span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-slate-500 block">Status:</span>
              <span className={online ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {online ? '● HEALTHY' : 'CONNECTING'}
              </span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-slate-500 block">Database Layer:</span>
              <span className="text-indigo-300">
                {data?.database?.status ? `${data.database.status}` : 'Connected (MongoDB)'}
              </span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
              <span className="text-slate-500 block">Auth Security:</span>
              <span className="text-slate-200">
                JWT (7d) + bcryptjs
              </span>
            </div>
          </div>
        </div>

        {/* Action Link Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                to="/login"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-center flex items-center justify-center gap-1.5"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default JoinModal;
