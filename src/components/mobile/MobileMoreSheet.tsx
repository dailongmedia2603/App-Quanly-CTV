import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  FilePieChart,
  FolderKanban,
  Users,
  Settings,
  BookOpen,
  User,
  Briefcase,
  ClipboardList,
  FileSpreadsheet,
  Cog
} from "lucide-react";

interface MobileMoreSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const MoreNavLink = ({ to, icon: Icon, children, onLinkClick }: { to: string; icon: React.ElementType; children: React.ReactNode; onLinkClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onLinkClick}
      className={cn(
        "flex items-center space-x-4 rounded-lg px-4 py-3 text-md font-medium text-gray-700 hover:bg-gray-100",
        isActive && "bg-brand-orange-light text-brand-orange"
      )}
    >
      <Icon className="h-6 w-6 flex-shrink-0" />
      <span>{children}</span>
    </Link>
  );
};

const MobileMoreSheet = ({ isOpen, onOpenChange }: MobileMoreSheetProps) => {
  const { hasPermission } = useAuth();

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle className="text-2xl">Menu Khác</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 space-y-2">
          {hasPermission('performance_reports') && <MoreNavLink to="/performance-report" icon={FilePieChart} onLinkClick={handleLinkClick}>Báo cáo hiệu suất</MoreNavLink>}
          {hasPermission('documents') && <MoreNavLink to="/documents" icon={FolderKanban} onLinkClick={handleLinkClick}>Tài liệu</MoreNavLink>}
          {hasPermission('public_services') && <MoreNavLink to="/services" icon={Briefcase} onLinkClick={handleLinkClick}>Dịch vụ</MoreNavLink>}
          {hasPermission('create_quote') && <MoreNavLink to="/create-quote" icon={FileSpreadsheet} onLinkClick={handleLinkClick}>Tạo báo giá</MoreNavLink>}
          {hasPermission('create_plan') && <MoreNavLink to="/create-plan" icon={ClipboardList} onLinkClick={handleLinkClick}>Tạo Plan</MoreNavLink>}
          {hasPermission('account') && <MoreNavLink to="/account" icon={Users} onLinkClick={handleLinkClick}>Tài khoản</MoreNavLink>}
          {hasPermission('settings') && <MoreNavLink to="/settings" icon={Settings} onLinkClick={handleLinkClick}>Settings</MoreNavLink>}
          <MoreNavLink to="/guide" icon={BookOpen} onLinkClick={handleLinkClick}>Hướng dẫn</MoreNavLink>
          <MoreNavLink to="/profile" icon={User} onLinkClick={handleLinkClick}>Thông tin tài khoản</MoreNavLink>
          
          {(hasPermission('config_scan_post') || hasPermission('config_content_ai') || hasPermission('config_create_plan')) && (
            <div className="pt-2">
              <h3 className="px-4 text-sm font-semibold text-gray-400 uppercase">Cấu hình</h3>
              <div className="mt-1 space-y-1">
                {hasPermission('config_scan_post') && <MoreNavLink to="/config/scan-post" icon={Cog} onLinkClick={handleLinkClick}>Quét Post</MoreNavLink>}
                {hasPermission('config_content_ai') && <MoreNavLink to="/config/content-ai" icon={Cog} onLinkClick={handleLinkClick}>Content AI</MoreNavLink>}
                {hasPermission('config_create_plan') && <MoreNavLink to="/config/create-plan" icon={Cog} onLinkClick={handleLinkClick}>Tạo plan</MoreNavLink>}
                {hasPermission('config_quote') && <MoreNavLink to="/config/quote" icon={Cog} onLinkClick={handleLinkClick}>Báo giá</MoreNavLink>}
              </div>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMoreSheet;