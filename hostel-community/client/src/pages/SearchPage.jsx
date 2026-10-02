import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  X,
  MessageSquare,
  Globe,
  Megaphone,
  BarChart2,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchContent } from '../services/searchService';
import { getRooms } from '../services/roomService';
import { getAvatarDisplay } from '../components/AvatarPicker';
import NotificationDropdown from '../components/NotificationDropdown';

const SEARCH_TABS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'rooms', label: 'Rooms', icon: Globe },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'polls', label: 'Polls', icon: BarChart2 },
];

const SUGGESTED_QUERIES = [
  'library',
  'mess dinner',
  'cultural night',
  'robotics',
  'menu',
  'global room',
];

export const SearchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialRoomId = searchParams.get('roomId') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialType);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [accessibleRooms, setAccessibleRooms] = useState([]);

  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const inputRef = useRef(null);

  // 1. Load user's accessible rooms for the room scope selector
  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      try {
        const res = await getRooms();
        if (isMounted && res?.data?.rooms) {
          setAccessibleRooms(res.data.rooms);
        }
      } catch {
        // Non-blocking fallback
      }
    };
    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Perform search when query, tab, room, or page changes
  const executeSearch = async (searchTerm, tabType, roomScope, pageNum = 1) => {
    const trimmed = (searchTerm || '').trim();

    // If query is empty and type is not 'rooms', clear results
    if (!trimmed && tabType !== 'rooms') {
      setResultsData(null);
      setError('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await searchContent({
        q: trimmed,
        type: tabType,
        roomId: roomScope || undefined,
        page: pageNum,
        limit: tabType === 'all' ? 20 : 15,
      });

      setResultsData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to complete search. Please try again.');
      setResultsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Sync with URL params
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const rId = searchParams.get('roomId') || '';
    const p = parseInt(searchParams.get('page'), 10) || 1;

    setQuery(q);
    setActiveTab(type);
    setSelectedRoomId(rId);
    setPage(p);

    if (q || type === 'rooms') {
      executeSearch(q, type, rId, p);
    } else {
      setResultsData(null);
    }
  }, [searchParams]);

  // Handle form submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams();
    if (query.trim()) newParams.set('q', query.trim());
    if (activeTab !== 'all') newParams.set('type', activeTab);
    if (selectedRoomId) newParams.set('roomId', selectedRoomId);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Clear search input
  const handleClear = () => {
    setQuery('');
    setResultsData(null);
    setError('');
    const newParams = new URLSearchParams();
    if (activeTab === 'rooms') {
      newParams.set('type', 'rooms');
    }
    setSearchParams(newParams);
    inputRef.current?.focus();
  };

  // Handle Tab Switch
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    if (tabId === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', tabId);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle Room Scope Change
  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    const newParams = new URLSearchParams(searchParams);
    if (roomId) {
      newParams.set('roomId', roomId);
    } else {
      newParams.delete('roomId');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle Suggestion Click
  const handleSuggestionClick = (suggested) => {
    setQuery(suggested);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', suggested);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Navigate to Message in Chat
  const handleNavigateToMessage = (msg) => {
    if (!msg?.room?.slug) return;
    navigate(`/community/${msg.room.slug}?messageId=${msg.id}`);
  };

  // Format timestamp helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Highlight matching keyword helper
  const renderHighlightedText = (text, term) => {
    if (!text) return null;
    if (!term || !term.trim()) return text;

    const words = term
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return text;

    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-indigo-500/30 text-indigo-200 px-0.5 rounded font-medium border border-indigo-500/40"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#080b12]/90 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Return to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                  Search & Discovery
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Prof. S.N. Bose Boys Hostel Community
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <span>{getAvatarDisplay(user?.anonymousAvatar)}</span>
              <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                {user?.anonymousName}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-[#0d1222] border border-white/[0.1] rounded-2xl sm:rounded-full p-2 shadow-2xl shadow-indigo-950/20 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <div className="flex items-center flex-1 px-3 gap-3 min-w-0">
              <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
                placeholder="Search messages, rooms, notices, or polls..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Room Scope Filter Dropdown */}
            <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-2 sm:pt-0">
              <select
                value={selectedRoomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="bg-slate-900/90 text-xs text-slate-300 rounded-xl px-3 py-2 border border-white/[0.06] hover:border-slate-700 focus:outline-none cursor-pointer"
                title="Filter by authorized room"
              >
                <option value="">All Accessible Rooms</option>
                {accessibleRooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} {r.allowedYear ? `(${r.allowedYear})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl sm:rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </div>

          {/* Suggested Queries */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 px-2">
            <span className="text-slate-500 font-medium">Quick suggestions:</span>
            {SUGGESTED_QUERIES.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300 hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-slate-800 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </form>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/[0.06] scrollbar-none">
          {SEARCH_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            let count = null;

            if (resultsData?.counts && tab.id in resultsData.counts) {
              count = resultsData.counts[tab.id];
            } else if (resultsData?.type === tab.id && resultsData?.pagination?.total !== undefined) {
              count = resultsData.pagination.total;
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/70 border border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {count !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-indigo-800/70 text-indigo-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => executeSearch(query, activeTab, selectedRoomId, page)}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-400">Searching community archive...</p>
          </div>
        )}

        {/* Empty Search State (User hasn't searched yet) */}
        {!loading && !resultsData && !error && (
          <div className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-950/30">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Search Community Knowledge</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Find past discussion messages, official announcements, community polls, and
                authorized rooms across Prof. S.N. Bose Boys Hostel.
              </p>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && resultsData && (
          <>
            {/* If type === 'all' and total === 0 */}
            {resultsData.type === 'all' && resultsData.total === 0 && (
              <div className="py-16 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No results found for "{query}"</h3>
                  <p className="text-xs text-slate-400">
                    No matching content in your authorized rooms. Try checking your spelling or using
                    broader keywords.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* If single category and results array is empty */}
            {resultsData.type !== 'all' && resultsData.results?.length === 0 && (
              <div className="py-16 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    No {activeTab} match "{query}"
                  </h3>
                  <p className="text-xs text-slate-400">
                    Try searching under "All" or switching the room filter.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('all')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                >
                  Search in All Categories
                </button>
              </div>
            )}

            {/* RESULTS RENDERING: TYPE === 'ALL' */}
            {resultsData.type === 'all' && resultsData.total > 0 && (
              <div className="space-y-8">
                {/* 1. Rooms Section */}
                {resultsData.results.rooms?.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>Rooms ({resultsData.results.rooms.length})</span>
                      </h2>
                      <button
                        onClick={() => handleTabChange('rooms')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {resultsData.results.rooms.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => navigate(`/community/${room.slug}`)}
                          className="p-4 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-md"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                                {room.name}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                  room.type === 'global'
                                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                }`}
                              >
                                {room.type === 'global' ? 'Global' : room.allowedYear}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {renderHighlightedText(room.description, query)}
                            </p>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-cyan-600 transition-colors flex-shrink-0">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. Announcements Section */}
                {resultsData.results.announcements?.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-indigo-400" />
                        <span>Announcements ({resultsData.results.announcements.length})</span>
                      </h2>
                      <button
                        onClick={() => handleTabChange('announcements')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-3">
                      {resultsData.results.announcements.map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => ann.room?.slug && navigate(`/community/${ann.room.slug}`)}
                          className="p-4 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-indigo-500/40 transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  ann.priority === 'urgent'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : ann.priority === 'important'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                }`}
                              >
                                {ann.priority}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {renderHighlightedText(ann.title, query)}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              {ann.room?.name} • {formatTime(ann.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {renderHighlightedText(ann.content, query)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. Polls Section */}
                {resultsData.results.polls?.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-emerald-400" />
                        <span>Community Polls ({resultsData.results.polls.length})</span>
                      </h2>
                      <button
                        onClick={() => handleTabChange('polls')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {resultsData.results.polls.map((poll) => (
                        <div
                          key={poll.id}
                          onClick={() => poll.room?.slug && navigate(`/community/${poll.room.slug}`)}
                          className="p-4 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-emerald-400">
                              {poll.isClosed ? 'Closed Poll' : 'Active Poll'}
                            </span>
                            <span>{poll.totalVotes} votes cast</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                            {renderHighlightedText(poll.question, query)}
                          </h4>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-white/[0.04]">
                            <span>{poll.room?.name}</span>
                            <span>{poll.optionsCount} choices</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. Messages Section */}
                {resultsData.results.messages?.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <span>Chat Messages ({resultsData.results.messages.length})</span>
                      </h2>
                      <button
                        onClick={() => handleTabChange('messages')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {resultsData.results.messages.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => handleNavigateToMessage(msg)}
                          className="p-3.5 sm:p-4 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all cursor-pointer space-y-2 group shadow-sm"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base flex-shrink-0">
                                {getAvatarDisplay(msg.sender?.anonymousAvatar)}
                              </span>
                              <span className="font-semibold text-slate-200 truncate">
                                {msg.sender?.anonymousName}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                {msg.sender?.year}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 text-slate-400 text-[11px]">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {msg.room?.name}
                              </span>
                              <span>{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                            {renderHighlightedText(msg.content, query)}
                          </p>

                          {msg.hasAttachment && msg.attachment && (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-white/[0.06] text-xs text-slate-300">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="truncate max-w-[200px]">
                                {msg.attachment.originalName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({(msg.attachment.size / 1024).toFixed(0)} KB)
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* RESULTS RENDERING: SPECIFIC CATEGORY TABS (with pagination) */}
            {resultsData.type !== 'all' && resultsData.results?.length > 0 && (
              <div className="space-y-4">
                {/* Specific Tab Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/[0.06]">
                  <span>
                    Showing {resultsData.results.length} of {resultsData.pagination?.total || 0}{' '}
                    results
                  </span>
                  <span>
                    Page {resultsData.pagination?.page || 1} of{' '}
                    {resultsData.pagination?.totalPages || 1}
                  </span>
                </div>

                {/* Specific Category Renderers */}
                {resultsData.type === 'messages' && (
                  <div className="space-y-3">
                    {resultsData.results.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => handleNavigateToMessage(msg)}
                        className="p-4 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all cursor-pointer space-y-2 group shadow-sm"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base flex-shrink-0">
                              {getAvatarDisplay(msg.sender?.anonymousAvatar)}
                            </span>
                            <span className="font-semibold text-slate-200 truncate">
                              {msg.sender?.anonymousName}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                              {msg.sender?.year}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 text-slate-400 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {msg.room?.name}
                            </span>
                            <span>{formatTime(msg.createdAt)}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                          {renderHighlightedText(msg.content, query)}
                        </p>

                        {msg.hasAttachment && msg.attachment && (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-white/[0.06] text-xs text-slate-300">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="truncate max-w-[200px]">
                              {msg.attachment.originalName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({(msg.attachment.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {resultsData.type === 'rooms' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resultsData.results.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => navigate(`/community/${room.slug}`)}
                        className="p-5 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group flex items-start justify-between gap-4 shadow-md"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                              {room.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                room.type === 'global'
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                              }`}
                            >
                              {room.type === 'global' ? 'Global' : room.allowedYear}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {renderHighlightedText(room.description, query)}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-cyan-600 transition-colors flex-shrink-0">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {resultsData.type === 'announcements' && (
                  <div className="space-y-3">
                    {resultsData.results.map((ann) => (
                      <div
                        key={ann.id}
                        onClick={() => ann.room?.slug && navigate(`/community/${ann.room.slug}`)}
                        className="p-4 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-indigo-500/40 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                ann.priority === 'urgent'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : ann.priority === 'important'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              {ann.priority}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {renderHighlightedText(ann.title, query)}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {ann.room?.name} • {formatTime(ann.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300">
                          {renderHighlightedText(ann.content, query)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {resultsData.type === 'polls' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resultsData.results.map((poll) => (
                      <div
                        key={poll.id}
                        onClick={() => poll.room?.slug && navigate(`/community/${poll.room.slug}`)}
                        className="p-5 rounded-2xl bg-[#0c101d] border border-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-emerald-400">
                            {poll.isClosed ? 'Closed Poll' : 'Active Poll'}
                          </span>
                          <span>{poll.totalVotes} total votes</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {renderHighlightedText(poll.question, query)}
                        </h4>
                        <div className="space-y-1 pt-1">
                          {poll.options?.slice(0, 3).map((opt) => (
                            <div
                              key={opt.id}
                              className="text-xs text-slate-400 flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/[0.03]"
                            >
                              <span className="truncate">{opt.text}</span>
                              <span className="font-mono text-slate-500">{opt.votes} votes</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-white/[0.04]">
                          <span>{poll.room?.name}</span>
                          <span className="text-indigo-400">Open in room →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {resultsData.pagination && resultsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                      type="button"
                      disabled={!resultsData.pagination.hasPrevPage}
                      onClick={() => {
                        const newPage = page - 1;
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('page', String(newPage));
                        setSearchParams(newParams);
                      }}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                    <span className="text-xs text-slate-400 font-mono">
                      {resultsData.pagination.page} / {resultsData.pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!resultsData.pagination.hasNextPage}
                      onClick={() => {
                        const newPage = page + 1;
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('page', String(newPage));
                        setSearchParams(newParams);
                      }}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
