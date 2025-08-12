import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Home, Target, SlidersHorizontal, FilePieChart, BarChart2, KeyRound, Settings, PanelLeftClose, PanelRightClose, Users, LifeBuoy } from "lucide-react";
import * as Icons from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

const NavLink = ({ to, icon: Icon, children, isCollapsed }: { to: string; icon: React.ElementType; children: React.ReactNode; isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const linkContent = (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100",
        isActive && "bg-brand-orange-light text-brand-orange",
        isCollapsed && "justify-center space-x-0"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && <span className="flex-1">{children}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right"><p>{children}</p></TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};

const SubNavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "block rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100",
        isActive && "text-brand-orange font-medium"
      )}
    >
      {children}
    </Link>
  );
};

// Define a map of allowed icons for type safety
const iconMap: Record<string, React.ElementType> = {
  LifeBuoy: Icons.LifeBuoy,
  HelpCircle: Icons.HelpCircle,
  MessageSquare: Icons.MessageSquare,
  Phone: Icons.Phone,
  BookOpen: Icons.BookOpen,
};

interface SupportWidgetData {
  support_widget_icon: string; // The DB stores a string
  support_widget_title: string;
  support_widget_description: string;
  support_widget_link: string;
}

const Sidebar = ({ isCollapsed, toggleSidebar }: { isCollapsed: boolean, toggleSidebar: () => void }) => {
  const location = useLocation();
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const isDataSourceActive = location.pathname.startsWith('/data-source');
  const [supportWidgetData, setSupportWidgetData] = useState<SupportWidgetData | null>(null);

  useEffect(() => {
    const fetchWidgetData = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('support_widget_icon, support_widget_title, support_widget_description, support_widget_link')
        .single();
      if (data) {
        setSupportWidgetData(data as SupportWidgetData);
      }
    };
    fetchWidgetData();
  }, []);

  const SupportIcon = (supportWidgetData && iconMap[supportWidgetData.support_widget_icon]) || LifeBuoy;

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "flex-shrink-0 border-r border-gray-200 bg-sidebar flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn(
          "flex h-16 flex-shrink-0 items-center justify-center border-b border-gray-200 px-4"
        )}>
          <Link to="/">
            <img src="/logolistenpro.png" alt="Listen Pro Logo" className="h-14 object-contain" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            <NavLink to="/overview" icon={Home} isCollapsed={isCollapsed}>Overview</NavLink>
            
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <div className="flex items-center justify-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600">
                    <SlidersHorizontal className="h-5 w-5 flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Thiết lập nguồn</p></TooltipContent>
              </Tooltip>
            ) : (
              <Accordion type="single" collapsible defaultValue={isDataSourceActive ? "item-1" : undefined}>
                <AccordionItem value="item-1" className="border-none">
                  <AccordionTrigger className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center space-x-3">
                      <SlidersHorizontal className="h-5 w-5" />
                      <span>Thiết lập nguồn</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8 pb-0">
                    <nav className="space-y-1">
                      <SubNavLink to="/data-source/website">Website</SubNavLink>
                      <SubNavLink to="/data-source/facebook">Group Facebook</SubNavLink>
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            <NavLink to="/" icon={Target} isCollapsed={isCollapsed}>Chiến dịch</NavLink>
            <NavLink to="/reports" icon={FilePieChart} isCollapsed={isCollapsed}>Báo cáo</NavLink>
            <NavLink to="/usage" icon={BarChart2} isCollapsed={isCollapsed}>Usage</NavLink>
            <NavLink to="/keys" icon={KeyRound} isCollapsed={isCollapsed}>API Keys</NavLink>
            {isSuperAdmin && <NavLink to="/account" icon={Users} isCollapsed={isCollapsed}>Tài khoản</NavLink>}
            {isSuperAdmin && <NavLink to="/settings" icon={Settings} isCollapsed={isCollapsed}>Settings</NavLink>}
          </nav>
        </div>
        <div className="border-t border-gray-200 p-4">
          {isCollapsed ? (
            <div className="flex justify-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
                <PanelRightClose className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <a href={supportWidgetData?.support_widget_link || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg border border-orange-200 bg-brand-orange-light p-3 cursor-pointer hover:bg-orange-100 no-underline text-current">
                <div className="flex items-center space-x-2">
                  <SupportIcon className="h-5 w-5 text-brand-orange" />
                  <div>
                    <p className="font-semibold text-sm leading-tight">{supportWidgetData?.support_widget_title || 'Hỗ trợ'}</p>
                    <p className="text-xs text-gray-600 leading-tight">{supportWidgetData?.support_widget_description || 'Liên hệ hỗ trợ'}</p>
                  </div>
                </div>
              </a>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={toggleSidebar}>
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;