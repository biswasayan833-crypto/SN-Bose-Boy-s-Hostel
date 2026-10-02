import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Shield, EyeOff, UserCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

export const HowItWorksModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      icon: UserCheck,
      title: 'Hostel Resident Registration',
      desc: 'Students create an account with their official hostel credentials and academic year (2nd, 3rd, or 4th Year). Institutional verification keeps the network private to S.N. Bose residents.',
    },
    {
      step: '02',
      icon: EyeOff,
      title: 'Pseudonym Generation & Masking',
      desc: 'The platform automatically generates a unique anonymous persona (e.g., "Anonymous Panda", "Midnight Owl", "Silent Rider") with your year badge. Your real name is not displayed to other students.',
    },
    {
      step: '03',
      icon: MessageSquare,
      title: 'Engage Freely in Year & Global Rooms',
      desc: 'Ask questions, review mess food, discuss courses, or seek senior placement guidance without peer bias or social friction.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <GlassCard variant="elevated" glow={true} className="relative w-full max-w-2xl p-4 sm:p-7 md:p-8 space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto animate-modal-enter">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-white truncate">How the Platform Works</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">Prof. S.N. Bose Boys Hostel</p>
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

        {/* Steps List */}
        <div className="space-y-3 sm:space-y-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] hover:border-indigo-500/30 transition-colors"
              >
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{s.step}</span>
                </div>

                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white">{s.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-white/[0.08]">
          <Badge variant="cyan" size="sm" className="w-full sm:w-auto justify-center text-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Real names are not displayed to other students</span>
          </Badge>

          <button
            onClick={() => {
              onClose();
              navigate(isAuthenticated ? '/dashboard' : '/register');
            }}
            className="btn-cinema-primary text-xs py-2.5 px-5 w-full sm:w-auto min-h-[44px] justify-center"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Create Free Account'}</span>
          </button>
        </div>

      </GlassCard>
    </div>
  );
};

export default HowItWorksModal;
