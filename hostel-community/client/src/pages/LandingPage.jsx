import React from 'react';
import Hero from '../components/Hero';
import CommunityPreview from '../components/CommunityPreview';
import AnonymousIdentity from '../components/AnonymousIdentity';
import Features from '../components/Features';
import AboutPlatform from '../components/AboutPlatform';

export const LandingPage = ({ onOpenEnter, onOpenHowItWorks, onSelectRoom }) => {
  return (
    <div className="flex flex-col space-y-4">
      <Hero
        onOpenEnter={onOpenEnter}
        onOpenHowItWorks={onOpenHowItWorks}
      />
      <CommunityPreview
        onSelectRoom={onSelectRoom}
      />
      <AnonymousIdentity />
      <Features />
      <AboutPlatform />
    </div>
  );
};

export default LandingPage;
