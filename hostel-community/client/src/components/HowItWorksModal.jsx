import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Shield, EyeOff, UserCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d1222] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">How the Platform Works</h3>
              <p className="text-xs text-slate-400">Prof. S.N. Bose Boys Hostel Community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/[0.05]"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                  {s.step}
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{s.title}</span>
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture Note */}
        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs text-slate-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Anti-Abuse Guarantee:</strong> While your real name is not displayed to other students, our backend retains secure institutional records to prevent harassment and maintain a respectful community.
          </span>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              navigate(isAuthenticated ? '/dashboard' : '/register');
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Create Account'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default HowItWorksModal;
