import React, { createContext, useContext, useState } from 'react';

const CommunityContext = createContext(null);

export const CommunityProvider = ({ children }) => {
  // Foundation state for future user & room states
  const [activeRoom, setActiveRoom] = useState('global');
  const [currentUser, setCurrentUser] = useState(null); // Intentionally null for Step 1

  const value = {
    activeRoom,
    setActiveRoom,
    currentUser,
    setCurrentUser,
    hostelName: 'Prof. S.N. Bose Boys Hostel',
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};

export default CommunityContext;
