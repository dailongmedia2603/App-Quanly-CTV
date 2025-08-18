import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Wallet, FolderKanban, User, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="flex flex-col items-center justify-center space-y-1 flex-1">
      <Icon className={cn("h-6 w-6", isActive ? "text-brand-orange" : "text-gray-500")} />
      <span className={cn("text-xs", isActive ? "text-brand-orange font-semibold" : "text-gray-500")}>
        {label}
      </span>
    </Link>
  );
};

const MobileBottomNav = () => {
  const { hasPermission } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg flex items-center justify-around z-50">
      {hasPermission('performance_reports') && <NavItem to="/performance-report" icon={BarChart3} label="Thống kê" />}
      {hasPermission('income') && <NavItem to="/income" icon={Wallet} label="Thu nhập" />}
      
      <div className="flex-1 flex justify-center">
        <button className="h-14 w-14 rounded-full bg-brand-orange text-white flex items-center justify-center -mt-8 border-4 border-white shadow-md">
          <QrCode className="h-7 w-7" />
        </button>
      </div>

      {hasPermission('documents') && <NavItem to="/documents" icon={FolderKanban} label="Tài liệu" />}
      <NavItem to="/profile" icon={User} label="Cá nhân" />
    </nav>
  );
};

export default MobileBottomNav;