import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '@/hooks/use-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileLayout from '@/components/mobile/MobileLayout';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" style={{ background: 'radial-gradient(circle at 100% 0, rgba(255, 244, 236, 0.5) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(255, 244, 236, 0.3) 0%, transparent 50%)' }}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;