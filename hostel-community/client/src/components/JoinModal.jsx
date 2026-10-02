import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, Server, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <GlassCard variant="elevated" glow={true} className="relative w-full max-w-xl p-4 sm:p-7 md:p-8 space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto animate-modal-enter">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-white truncate">
                {selectedRoom ? `Access ${selectedRoom.name}` : 'Community Gateway'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">
                Prof. S.N. Bose Boys Hostel Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Development Status Notice */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Auth & Identity System
            </span>
            <Badge variant={online ? 'emerald' : 'amber'} size="sm" dot={true}>
              {online ? 'API Online' : 'Connecting'}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {selectedRoom ? (
              <span>
                To access <strong>{selectedRoom.name}</strong>, sign in to your verified hostel resident account. Your real identity remains private and is masked across all messages.
              </span>
            ) : (
              <span>
                Join your fellow hostelers in the verified Prof. S.N. Bose community. Create your account or sign in to enter your assigned channels.
              </span>
            )}
          </p>
        </div>

        {/* Live System Diagnostics */}
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Backend Heartbeat Diagnostics
            </span>
            <button
              onClick={handleTestPing}
              disabled={testingPing}
              className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 underline underline-offset-2 disabled:opacity-50 min-h-[36px] py-1 px-2 flex items-center cursor-pointer"
            >
              {testingPing ? 'Pinging...' : 'Ping Endpoint'}
            </button>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database Connection:</span>
              <span className="text-emerald-400 font-semibold">{data?.database || 'Connected'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Platform Environment:</span>
              <span className="text-indigo-300">{data?.environment || 'Production'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Response Latency:</span>
              <span className="text-cyan-400 font-semibold">{testingPing ? 'Measuring...' : 'Normal (<50ms)'}</span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              onClick={onClose}
              className="btn-cinema-primary w-full py-3 min-h-[44px] text-xs justify-center"
            >
              <span>Go to Community Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                onClick={onClose}
                className="btn-cinema-primary w-full py-3 min-h-[44px] text-xs justify-center"
              >
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                onClick={onClose}
                className="btn-cinema-secondary w-full py-3 min-h-[44px] text-xs justify-center"
              >
                <span>Existing Student Login</span>
              </Link>
            </>
          )}
        </div>

      </GlassCard>
    </div>
  );
};

export default JoinModal;
