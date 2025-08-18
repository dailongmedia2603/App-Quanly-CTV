import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PenSquare, MessageSquare } from "lucide-react";

interface MobileCreateContentSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const MobileCreateContentSheet = ({ isOpen, onOpenChange }: MobileCreateContentSheetProps) => {
  const { hasPermission } = useAuth();

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Tạo Content</SheetTitle>
          <SheetDescription>Chọn loại nội dung bạn muốn tạo.</SheetDescription>
        </SheetHeader>
        <nav className="mt-4 space-y-2">
          {hasPermission('create_post') && (
            <Link to="/create-content/post" onClick={handleLinkClick} className="flex items-center space-x-4 rounded-lg p-4 text-md font-medium text-gray-700 hover:bg-gray-100">
              <PenSquare className="h-6 w-6 text-brand-orange" />
              <span>Tạo bài viết</span>
            </Link>
          )}
          {hasPermission('create_comment') && (
            <Link to="/create-content/comment" onClick={handleLinkClick} className="flex items-center space-x-4 rounded-lg p-4 text-md font-medium text-gray-700 hover:bg-gray-100">
              <MessageSquare className="h-6 w-6 text-brand-orange" />
              <span>Tạo comment</span>
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileCreateContentSheet;