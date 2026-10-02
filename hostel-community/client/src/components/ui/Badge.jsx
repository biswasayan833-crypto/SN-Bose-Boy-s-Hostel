import React from 'react';

/**
 * Reusable Badge primitive for Task 10 Design System
 * Formats status indicators, academic-year labels, room scopes, and priority tags consistently.
 */
export const Badge = ({
  children,
  variant = 'indigo', // 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'neutral'
  size = 'md',        // 'sm' | 'md'
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    indigo: {
      container: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400',
    },
    violet: {
      container: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
      dot: 'bg-violet-400',
    },
    cyan: {
      container: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    emerald: {
      container: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    amber: {
      container: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    rose: {
      container: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    neutral: {
      container: 'bg-slate-800/80 text-slate-300 border-white/[0.08]',
      dot: 'bg-slate-400',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.indigo;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${currentVariant.container} ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentVariant.dot} animate-subtle-pulse`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
