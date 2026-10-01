import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Megaphone,
  BarChart2,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Globe,
  GraduationCap,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRooms } from '../services/roomService';
import announcementService from '../services/announcementService';
import pollService from '../services/pollService';
import AnnouncementCard from '../components/AnnouncementCard';
import PollCard from '../components/PollCard';

export const AdminAnnouncements = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'polls'
  const [rooms, setRooms] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Announcement Modal State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editingAnnounceId, setEditingAnnounceId] = useState(null);
  const [announceForm, setAnnounceForm] = useState({
    title: '',
    content: '',
    targetRoom: '',
    priority: 'normal',
    isPinned: false,
    expiresAt: '',
  });

  // Poll Modal State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollForm, setPollForm] = useState({
    question: '',
    options: ['', ''],
    room: '',
    allowVoteChange: false,
    expiresAt: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [roomsRes, announceRes, pollsRes] = await Promise.all([
        getRooms(),
        announcementService.getAnnouncements(),
        pollService.getPolls(),
      ]);

      if (roomsRes?.data?.rooms) {
        setRooms(roomsRes.data.rooms);
        if (!announceForm.targetRoom && roomsRes.data.rooms.length > 0) {
          setAnnounceForm((prev) => ({ ...prev, targetRoom: roomsRes.data.rooms[0]._id }));
        }
        if (!pollForm.room && roomsRes.data.rooms.length > 0) {
          setPollForm((prev) => ({ ...prev, room: roomsRes.data.rooms[0]._id }));
        }
      }

      if (announceRes?.data?.announcements) {
        setAnnouncements(announceRes.data.announcements);
      }

      if (pollsRes?.data?.polls) {
        setPolls(pollsRes.data.polls);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrative community data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0b0f19] border border-rose-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 mb-6">
            Administrator privileges are strictly required to manage announcements and community polls.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- Announcement Handlers ---
  const handleOpenCreateAnnounce = () => {
    setEditingAnnounceId(null);
    setAnnounceForm({
      title: '',
      content: '',
      targetRoom: rooms[0]?._id || '',
      priority: 'normal',
      isPinned: false,
      expiresAt: '',
    });
    setShowAnnounceModal(true);
  };

  const handleOpenEditAnnounce = (item) => {
    setEditingAnnounceId(item.id);
    setAnnounceForm({
      title: item.title,
      content: item.content,
      targetRoom: item.targetRoom?.id || item.targetRoom?._id || rooms[0]?._id || '',
      priority: item.priority || 'normal',
      isPinned: Boolean(item.isPinned),
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : '',
    });
    setShowAnnounceModal(true);
  };

  const handleSubmitAnnounce = async (e) => {
    e.preventDefault();
    if (!announceForm.title.trim() || !announceForm.content.trim() || !announceForm.targetRoom) {
      setError('Please provide title, content, and target room.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        title: announceForm.title.trim(),
        content: announceForm.content.trim(),
        targetRoom: announceForm.targetRoom,
        priority: announceForm.priority,
        isPinned: announceForm.isPinned,
        expiresAt: announceForm.expiresAt ? new Date(announceForm.expiresAt).toISOString() : null,
      };

      if (editingAnnounceId) {
        const res = await announcementService.updateAnnouncement(editingAnnounceId, payload);
        if (res?.data?.announcement) {
          setAnnouncements((prev) =>
            prev.map((a) => (a.id === editingAnnounceId ? res.data.announcement : a))
          );
          setSuccessMsg('Announcement updated successfully.');
        }
      } else {
        const res = await announcementService.createAnnouncement(payload);
        if (res?.data?.announcement) {
          setAnnouncements((prev) => [res.data.announcement, ...prev]);
          setSuccessMsg('Announcement published successfully.');
        }
      }

      setShowAnnounceModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnounce = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    try {
      await announcementService.deleteAnnouncement(item.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
      setSuccessMsg('Announcement deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
    }
  };

  const handleTogglePinAnnounce = async (item) => {
    try {
      const res = await announcementService.updateAnnouncement(item.id, {
        isPinned: !item.isPinned,
      });
      if (res?.data?.announcement) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === item.id ? res.data.announcement : a))
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle pin state.');
    }
  };

  // --- Poll Handlers ---
  const handleOpenCreatePoll = () => {
    setPollForm({
      question: '',
      options: ['', ''],
      room: rooms[0]?._id || '',
      allowVoteChange: false,
      expiresAt: '',
    });
    setShowPollModal(true);
  };

  const handleAddPollOption = () => {
    if (pollForm.options.length < 6) {
      setPollForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const handleRemovePollOption = (idx) => {
    if (pollForm.options.length > 2) {
      setPollForm((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== idx),
      }));
    }
  };

  const handlePollOptionChange = (idx, val) => {
    setPollForm((prev) => {
      const copy = [...prev.options];
      copy[idx] = val;
      return { ...prev, options: copy };
    });
  };

  const handleSubmitPoll = async (e) => {
    e.preventDefault();
    if (!pollForm.question.trim() || !pollForm.room) {
      setError('Poll question and target room are required.');
      return;
    }

    const cleanOptions = pollForm.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        question: pollForm.question.trim(),
        options: cleanOptions,
        room: pollForm.room,
        allowVoteChange: pollForm.allowVoteChange,
        expiresAt: pollForm.expiresAt ? new Date(pollForm.expiresAt).toISOString() : null,
      };

      const res = await pollService.createPoll(payload);
      if (res?.data?.poll) {
        setPolls((prev) => [res.data.poll, ...prev]);
        setSuccessMsg('Poll created successfully.');
        setShowPollModal(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create poll.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePoll = async (item) => {
    if (!window.confirm('Close this poll and prevent further voting?')) return;
    try {
      const res = await pollService.closePoll(item.id);
      if (res?.data?.poll) {
        setPolls((prev) => prev.map((p) => (p.id === item.id ? res.data.poll : p)));
        setSuccessMsg('Poll closed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to close poll.');
    }
  };

  const handleDeletePoll = async (item) => {
    if (!window.confirm('Delete this poll permanently?')) return;
    try {
      await pollService.deletePoll(item.id);
      setPolls((prev) => prev.filter((p) => p.id !== item.id));
      setSuccessMsg('Poll deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete poll.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#080b12]/90 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white leading-tight">
                    Admin Community Hub
                  </h1>
                  <p className="text-xs text-slate-400">Announcements & Polls Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/admin/reports"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
              >
                Moderation Reports
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Alert Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Switcher & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-[#0b0f19] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              Announcements ({announcements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('polls')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'polls'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Community Polls ({polls.length})
            </button>
          </div>

          <div>
            {activeTab === 'announcements' ? (
              <button
                type="button"
                onClick={handleOpenCreateAnnounce}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Post Announcement
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreatePoll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Poll
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Announcements Content */}
        {activeTab === 'announcements' && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-[#0b0f19] border border-white/[0.06] p-8">
                <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">No Announcements Yet</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">
                  Publish hostel notices, event notifications, and urgent community alerts.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateAnnounce}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create First Announcement
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((item) => (
                  <AnnouncementCard
                    key={item.id}
                    announcement={item}
                    isAdmin={true}
                    onEdit={handleOpenEditAnnounce}
                    onDelete={handleDeleteAnnounce}
                    onTogglePin={handleTogglePinAnnounce}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Polls Content */}
        {activeTab === 'polls' && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-slate-500 text-sm">Loading polls...</div>
            ) : polls.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-[#0b0f19] border border-white/[0.06] p-8">
                <BarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">No Polls Active</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">
                  Create interactive community votes on hostel events, tournaments, or decisions.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreatePoll}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create First Poll
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {polls.map((item) => (
                  <PollCard
                    key={item.id}
                    poll={item}
                    isAdmin={true}
                    onClose={handleClosePoll}
                    onDelete={handleDeletePoll}
                    onPollUpdated={(updated) => {
                      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- CREATE / EDIT ANNOUNCEMENT MODAL --- */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0b0f19] border border-white/[0.1] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingAnnounceId ? 'Edit Announcement' : 'Post New Announcement'}
              </h3>
              <button
                onClick={() => setShowAnnounceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAnnounce} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={announceForm.title}
                  onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                  placeholder="e.g. Hostel Meeting Tomorrow"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Room
                </label>
                <select
                  required
                  value={announceForm.targetRoom}
                  onChange={(e) => setAnnounceForm({ ...announceForm, targetRoom: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.type === 'global' ? 'All Residents' : r.allowedYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={announceForm.priority}
                    onChange={(e) => setAnnounceForm({ ...announceForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Normal (General Notice)</option>
                    <option value="important">Important (Generates Notification)</option>
                    <option value="urgent">Urgent (Urgent Notification)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Expires At (Optional)
                  </label>
                  <input
                    type="date"
                    value={announceForm.expiresAt}
                    onChange={(e) => setAnnounceForm({ ...announceForm, expiresAt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Content
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={2000}
                  value={announceForm.content}
                  onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                  placeholder="Detailed announcement content..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={announceForm.isPinned}
                  onChange={(e) => setAnnounceForm({ ...announceForm, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <label htmlFor="pinCheck" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Pin to top of room announcements
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : editingAnnounceId ? 'Save Changes' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE POLL MODAL --- */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0b0f19] border border-white/[0.1] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Create Community Poll</h3>
              <button
                onClick={() => setShowPollModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPoll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Question
                </label>
                <input
                  type="text"
                  required
                  maxLength={300}
                  value={pollForm.question}
                  onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                  placeholder="e.g. What sport tournament should we organize?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Room
                </label>
                <select
                  required
                  value={pollForm.room}
                  onChange={(e) => setPollForm({ ...pollForm, room: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.type === 'global' ? 'All Residents' : r.allowedYear})
                    </option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Options (2 to 6)
                  </label>
                  {pollForm.options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {pollForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                      {pollForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Expires At (Optional)
                </label>
                <input
                  type="date"
                  value={pollForm.expiresAt}
                  onChange={(e) => setPollForm({ ...pollForm, expiresAt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="voteChangeCheck"
                  checked={pollForm.allowVoteChange}
                  onChange={(e) => setPollForm({ ...pollForm, allowVoteChange: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <label htmlFor="voteChangeCheck" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Allow students to change their vote
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
