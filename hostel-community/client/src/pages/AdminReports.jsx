import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import { getAvatarDisplay } from '../components/AvatarPicker';

export const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, reviewed: 0, dismissed: 0, actioned: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getReports(params);
      if (res?.data) {
        setReports(res.data.reports || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load moderation reports.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports();
    }
  }, [user, fetchReports]);


  // Handle status update
  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setProcessingId(reportId);
      setActionSuccess('');
      const res = await adminService.updateReport(reportId, { status: newStatus });
      if (res?.data?.report) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? res.data.report : r))
        );
        setActionSuccess(`Report status updated to '${newStatus}'.`);
        // Refresh counts
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update report status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle removing message (actioned)
  const handleRemoveMessage = async (reportId) => {
    if (!window.confirm('Are you sure you want to remove this reported message? It will be replaced with "Message deleted."')) {
      return;
    }

    try {
      setProcessingId(reportId);
      setActionSuccess('');
      const res = await adminService.updateReport(reportId, {
        action: 'delete_message',
        status: 'actioned',
        notes: 'Message removed by administrator during moderation review.',
      });

      if (res?.data?.report) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? res.data.report : r))
        );
        setActionSuccess('Message removed successfully and report marked as Actioned.');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove message.');
    } finally {
      setProcessingId(null);
    }
  };

  // Format date helper
  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // If user is not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0d1222] border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">403 — Forbidden</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are logged in as <strong className="text-slate-200">{user.anonymousName}</strong> ({user.year}), which does not have administrative moderation clearance.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Community Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#080b12]/95 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-rose-600 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[11px] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white">
                    Moderation Hub
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Admin Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Prof. S.N. Bose Boys Hostel Community Safety
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              to="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner with Summary Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'All Reports', key: '', count: counts.total, color: 'text-white' },
            { label: 'Pending', key: 'pending', count: counts.pending, color: 'text-amber-400' },
            { label: 'Reviewed', key: 'reviewed', count: counts.reviewed, color: 'text-blue-400' },
            { label: 'Actioned', key: 'actioned', count: counts.actioned, color: 'text-rose-400' },
            { label: 'Dismissed', key: 'dismissed', count: counts.dismissed, color: 'text-slate-400' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.key)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                statusFilter === tab.key
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-[#0d1222]/80 border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div className="text-[11px] text-slate-400 font-medium">{tab.label}</div>
              <div className={`text-xl font-bold font-mono ${tab.color}`}>{tab.count}</div>
            </button>
          ))}
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Reports Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Reported Messages</span>
              <span className="text-xs font-mono text-slate-400">({reports.length})</span>
            </h2>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Anonymous identities protected</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
              <p className="text-xs font-mono text-slate-400">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 bg-[#0b0f19] border border-white/[0.06] rounded-3xl text-center space-y-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No reports found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {statusFilter
                  ? `There are no reports with status '${statusFilter}'.`
                  : 'The community channels are calm with zero pending message reports.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => {
                const isDeletedMsg = report.message?.isDeleted;

                return (

                  <div
                    key={report.id}
                    className="bg-[#0b0f19]/90 border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl hover:border-white/[0.15] transition-colors"
                  >
                    {/* Header Row: Room, Reason, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                            report.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : report.status === 'reviewed'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : report.status === 'actioned'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {report.status}
                        </span>

                        {/* Reason Badge */}
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 capitalize">
                          Reason: {report.reason}
                        </span>

                        {/* Room Badge */}
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {report.message?.room?.name || 'Channel'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500">
                        {formatDate(report.createdAt)}
                      </div>
                    </div>

                    {/* Reported Message Content Box */}
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/[0.05] space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>{getAvatarDisplay(report.message?.sender?.anonymousAvatar)}</span>
                          <span className="font-semibold text-slate-200">
                            {report.message?.sender?.anonymousName || 'Anonymous Student'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                            {report.message?.sender?.year || 'Hostel Resident'}
                          </span>
                        </div>
                        {isDeletedMsg && (
                          <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded">
                            Deleted from channel
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-100 pt-1 leading-relaxed">
                        {isDeletedMsg ? (
                          <span className="italic text-slate-400 flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                            Message deleted
                          </span>
                        ) : (
                          report.message?.content || '<No content>'
                        )}
                      </div>
                    </div>

                    {/* Reporter Info & Action Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      
                      {/* Reported By Anonymous Persona */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-500">Reported by:</span>
                        <span>{getAvatarDisplay(report.reportedBy?.anonymousAvatar)}</span>
                        <span className="font-medium text-slate-300">
                          {report.reportedBy?.anonymousName}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          ({report.reportedBy?.year})
                        </span>
                      </div>

                      {/* Moderation Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Remove Message Button */}
                        {!isDeletedMsg && (
                          <button
                            type="button"
                            disabled={processingId === report.id}
                            onClick={() => handleRemoveMessage(report.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Message</span>
                          </button>
                        )}

                        {/* Status Select */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Status:</span>
                          <select
                            value={report.status}
                            disabled={processingId === report.id}
                            onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="actioned">Actioned</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

    </div>
  );
};

export default AdminReports;
