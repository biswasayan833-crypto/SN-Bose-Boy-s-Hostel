import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { online } = useHealthCheck();
  const { isAuthenticated } = useAuth();

  return (
    <footer className="border-t border-white/[0.08] bg-[#070a12] text-slate-400 text-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Column 1: Brand & Ethos */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px]">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[11px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="font-bold text-base text-white tracking-tight block">
                  Prof. S.N. Bose
                </span>
                <span className="text-[11px] font-medium tracking-wider uppercase text-slate-500 block">
                  Boys Hostel Community Platform
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              A private digital haven designed specifically for hostel residents to communicate, connect, ask questions, and share thoughts freely without exposing their real names to peers.
            </p>

            <div className="pt-2 text-xs text-indigo-400 font-medium">
              "Your Hostel. Your Voice. Your Community."
            </div>
          </div>

          {/* Column 2: Navigation & Channels (ONLY Global, 2nd, 3rd, 4th Year) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-200">
              Community Channels
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to={isAuthenticated ? '/dashboard' : '/register'} className="hover:text-white transition-colors">
                  🌍 Global Hostel Town Square
                </Link>
              </li>
              <li>
                <Link to={isAuthenticated ? '/dashboard' : '/register'} className="hover:text-white transition-colors">
                  🎓 2nd Year Community
                </Link>
              </li>
              <li>
                <Link to={isAuthenticated ? '/dashboard' : '/register'} className="hover:text-white transition-colors">
                  🎓 3rd Year Community
                </Link>
              </li>
              <li>
                <Link to={isAuthenticated ? '/dashboard' : '/register'} className="hover:text-white transition-colors">
                  🎓 4th Year Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Privacy & Protocol */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-200">
              Security & Verification
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed with a dual-tier architecture: your real name is not displayed to other students, while institutional verification maintains account safety and prevents abuse.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
                JWT + bcryptjs
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
                React 19 + Vite
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-300">
                Node.js + Express + MongoDB
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span>Built for the students of</span>
            <strong className="text-white">Prof. S.N. Bose Boys Hostel</strong>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={online ? 'text-emerald-400' : 'text-amber-400'}>
                {online ? 'API System Healthy' : 'API Connecting'}
              </span>
            </span>
            <span className="text-slate-600">|</span>
            <span>Task 2: Authentication & Anonymous Identity</span>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
