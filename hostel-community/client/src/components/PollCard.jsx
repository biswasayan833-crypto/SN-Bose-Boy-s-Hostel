import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Globe,
  GraduationCap,
  Lock,
  RotateCcw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { votePoll, retractVote } from '../services/pollService';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

export const PollCard = ({
  poll,
  isAdmin = false,
  onPollUpdated = null,
  onDelete = null,
  onClose = null,
}) => {
  if (!poll) return null;

  const {
    id,
    question,
    options = [],
    totalVotes = 0,
    room,
    allowVoteChange = false,
    isClosed = false,
    isExpired = false,
    expiresAt,
    userVotedOptionId,
    hasVoted = false,
  } = poll;

  const [selectedOption, setSelectedOption] = useState(userVotedOptionId || '');
  const [isChangingVote, setIsChangingVote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveClosed = isClosed || isExpired;
  const showResults = (hasVoted && !isChangingVote) || effectiveClosed;

  const handleVote = async () => {
    if (!selectedOption || submitting || effectiveClosed) return;
    try {
      setSubmitting(true);
      setError('');
      const res = await votePoll(id, selectedOption);
      setIsChangingVote(false);
      if (onPollUpdated && res?.data?.poll) {
        onPollUpdated(res.data.poll);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit vote.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetract = async () => {
    if (!allowVoteChange || submitting || effectiveClosed) return;
    try {
      setSubmitting(true);
      setError('');
      const res = await retractVote(id);
      setSelectedOption('');
      setIsChangingVote(true);
      if (onPollUpdated && res?.data?.poll) {
        onPollUpdated(res.data.poll);
      }
    } catch (err) {
      setError(err.message || 'Failed to retract vote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard variant="default" glow={!effectiveClosed} hoverLift={true} className="p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="emerald" size="sm">
              <BarChart2 className="w-3 h-3" />
              <span>Community Poll</span>
            </Badge>

            {room && (
              <Badge variant="neutral" size="sm">
                {room.type === 'global' ? (
                  <Globe className="w-3 h-3 text-cyan-400" />
                ) : (
                  <GraduationCap className="w-3 h-3 text-indigo-400" />
                )}
                <span>{room.name}</span>
              </Badge>
            )}

            {effectiveClosed && (
              <Badge variant="neutral" size="sm">
                <Lock className="w-3 h-3" />
                <span>Closed</span>
              </Badge>
            )}
          </div>

          {/* Admin Management Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              {!effectiveClosed && onClose && (
                <button
                  type="button"
                  onClick={() => onClose(poll)}
                  title="Close poll"
                  className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(poll)}
                  title="Delete poll"
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-400 hover:text-rose-400 hover:bg-slate-700 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Question */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-4 leading-snug">
          {question}
        </h3>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2.5 mb-5">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isUserVotedChoice = userVotedOptionId === opt.id;

            if (showResults) {
              // Results Progress Bar View
              return (
                <div
                  key={opt.id}
                  className={`relative overflow-hidden rounded-xl border p-3 transition-all ${
                    isUserVotedChoice
                      ? 'border-indigo-500/50 bg-indigo-950/20'
                      : 'border-white/[0.06] bg-slate-900/40'
                  }`}
                >
                  {/* Background progress fill */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-l-xl ${
                      isUserVotedChoice
                        ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/30'
                        : 'bg-slate-800/50'
                    }`}
                    style={{ width: `${opt.percentage || 0}%` }}
                  />

                  {/* Content overlay */}
                  <div className="relative flex items-center justify-between text-sm z-10">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      {isUserVotedChoice && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      )}
                      <span>{opt.text}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-300 text-xs">
                      <span>{opt.votes} votes</span>
                      <span className="text-indigo-400 font-bold">{opt.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              );
            }

            // Interactive Voting Radio View
            return (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600/10 text-white shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-white/[0.06] bg-slate-900/40 text-slate-300 hover:border-white/[0.15] hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`poll-${id}`}
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => setSelectedOption(opt.id)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium">{opt.text}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>{totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}</span>
          {allowVoteChange && !effectiveClosed && (
            <span className="hidden sm:inline text-slate-500">• Vote changes allowed</span>
          )}
        </div>

        {/* Voting & Change Vote Actions */}
        <div>
          {!effectiveClosed && !showResults && (
            <button
              type="button"
              onClick={handleVote}
              disabled={!selectedOption || submitting}
              className="btn-cinema-primary text-xs py-1.5 px-4 shadow-md"
            >
              {submitting ? 'Submitting...' : 'Vote'}
            </button>
          )}

          {!effectiveClosed && showResults && allowVoteChange && (
            <button
              type="button"
              onClick={() => setIsChangingVote(true)}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Change Vote
            </button>
          )}

          {isChangingVote && (
            <button
              type="button"
              onClick={() => setIsChangingVote(false)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors ml-2"
            >
              Cancel
            </button>
          )}

          {effectiveClosed && (
            <span className="text-xs text-slate-500">Poll ended</span>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default PollCard;
