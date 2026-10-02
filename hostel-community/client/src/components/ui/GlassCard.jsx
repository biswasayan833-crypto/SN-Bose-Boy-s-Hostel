import React from 'react';

/**
 * Reusable GlassCard primitive for Task 10 Design System
 * Provides consistent glassmorphism, depth borders, top illumination, and micro-hover states.
 */
export const GlassCard = ({
  children,
  variant = 'default', // 'default' | 'interactive' | 'deep' | 'elevated' | 'glow'
  glow = false,        // If true, adds the subtle top iridescent border line
  hoverLift = false,   // If true, applies smooth hover lift and glow
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'interactive':
        return 'glass-panel-interactive';
      case 'deep':
        return 'glass-panel-deep';
      case 'elevated':
        return 'glass-panel-elevated';
      case 'glow':
        return 'glass-panel glass-card-glow';
      case 'default':
      default:
        return 'glass-panel';
    }
  };

  const glowClass = glow && variant !== 'glow' ? 'glass-card-glow' : '';
  const liftClass = hoverLift ? 'hover-lift' : '';

  return (
    <Component
      className={`rounded-2xl ${getVariantClass()} ${glowClass} ${liftClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GlassCard;
