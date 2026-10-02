import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HowItWorksModal from '../components/HowItWorksModal';
import JoinModal from '../components/JoinModal';
import { CinematicBackground } from '../components/ui/CinematicBackground';

export const MainLayout = ({ children }) => {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleOpenJoin = (room = null) => {
    setSelectedRoom(room);
    setIsJoinOpen(true);
  };

  const handleCloseJoin = () => {
    setIsJoinOpen(false);
    setSelectedRoom(null);
  };

  return (
    <CinematicBackground className="selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        onOpenJoin={() => handleOpenJoin(null)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* Render children with injected handlers */}
      <main className="flex-grow">
        {React.cloneElement(children, {
          onOpenEnter: () => handleOpenJoin(null),
          onOpenHowItWorks: () => setIsHowItWorksOpen(true),
          onSelectRoom: (room) => handleOpenJoin(room),
        })}
      </main>

      <Footer
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenJoin={() => handleOpenJoin(null)}
      />

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onOpenJoin={() => handleOpenJoin(null)}
      />

      <JoinModal
        isOpen={isJoinOpen}
        onClose={handleCloseJoin}
        selectedRoom={selectedRoom}
      />
    </CinematicBackground>
  );
};

export default MainLayout;
