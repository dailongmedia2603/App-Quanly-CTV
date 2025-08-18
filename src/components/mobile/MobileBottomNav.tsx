import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, UserCheck, Wallet, PenSquare, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import MobileMoreSheet from './MobileMoreSheet';
import MobileCreateContentSheet from './MobileCreateContentSheet';

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

const NavButton = ({ onClick, icon: Icon, label }: { onClick: () => void; icon: React.ElementType; label: string }) => {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 flex-1">
      <Icon className="h-6 w-6 text-gray-500" />
      <span className="text-xs text-gray-500">
        {label}
      </span>
    </button>
  );
};

const MobileBottomNav = () => {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isCreateContentSheetOpen, setIsCreateContentSheetOpen] = useState(false);

  const isIncomeActive = location.pathname === '/income';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg flex items-center justify-around z-50">
        {hasPermission('find_customers') && <NavItem to="/find-customers" icon={Search} label="Tìm KH" />}
        {hasPermission('customer_consulting') && <NavItem to="/create-content/customer-consulting" icon={UserCheck} label="Tư vấn" />}
        
        <Link to="/income" className="flex-1 flex justify-center">
          <div className={cn(
            "h-16 w-16 rounded-full text-white flex flex-col items-center justify-center -mt-6 border-4 border-white shadow-md",
            isIncomeActive ? "bg-brand-orange" : "bg-gray-400"
          )}>
            <Wallet className="h-6 w-6" />
            <span className="text-xs font-semibold mt-0.5">Thu nhập</span>
          </div>
        </Link>

        {(hasPermission('create_post') || hasPermission('create_comment')) && (
          <NavButton onClick={() => setIsCreateContentSheetOpen(true)} icon={PenSquare} label="Tạo content" />
        )}
        <NavButton onClick={() => setIsMoreSheetOpen(true)} icon={Menu} label="Khác" />
      </nav>
      <MobileMoreSheet isOpen={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen} />
      <MobileCreateContentSheet isOpen={isCreateContentSheetOpen} onOpenChange={setIsCreateContentSheetOpen} />
    </>
  );
};

export default MobileBottomNav;