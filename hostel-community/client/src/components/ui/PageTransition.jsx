import React from 'react';

/**
 * PageTransition
 * 
 * Lightweight GPU-accelerated page entrance wrapper for Task 10 Phase 5.
 * Uses CSS keyframes to provide instant smooth fade + micro-translate entrance
 * without requiring bulky external animation libraries.
 */
export const PageTransition = ({ children, className = '', ...rest }) => {
  return (
    <div className={`animate-page-enter w-full flex-1 flex flex-col ${className}`}>
      {React.isValidElement(children) && Object.keys(rest).length > 0
        ? React.cloneElement(children, rest)
        : children}
    </div>
  );
};

export default PageTransition;
