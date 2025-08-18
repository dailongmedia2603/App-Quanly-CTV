import React from 'react';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default MobileLayout;