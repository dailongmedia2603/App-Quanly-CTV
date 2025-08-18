import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Landmark, Hash, Wallet, Calendar, Clock, CheckCircle, Ban } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AdminUser extends SupabaseUser {
  banned_until?: string;
  roles: string[];
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  momo?: string | null;
}

interface UserDetailsDialogProps {
  user: AdminUser | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
  <div className="flex items-start space-x-3">
    <Icon className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value || <span className="text-gray-400 italic">Chưa cập nhật</span>}</p>
    </div>
  </div>
);

export const UserDetailsDialog = ({ user, isOpen, onOpenChange }: UserDetailsDialogProps) => {
  if (!user) return null;

  const getInitials = (email: string) => (email ? email.charAt(0).toUpperCase() : "P");
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const isBanned = user.banned_until && new Date(user.banned_until) > new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.user_metadata.avatar_url} />
              <AvatarFallback className="bg-brand-orange-light text-brand-orange text-2xl">{getInitials(user.email || "")}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{fullName || user.email}</DialogTitle>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem icon={User} label="Họ" value={user.first_name} />
              <DetailItem icon={User} label="Tên" value={user.last_name} />
              <DetailItem icon={Phone} label="Số điện thoại" value={user.phone} />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Thông tin thanh toán</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem icon={Landmark} label="Ngân hàng" value={user.bank_name} />
              <DetailItem icon={Hash} label="Số tài khoản" value={user.bank_account_number} />
              <DetailItem icon={User} label="Tên tài khoản" value={user.bank_account_name} />
              <DetailItem icon={Wallet} label="Momo" value={user.momo} />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Thông tin hệ thống</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem icon={Calendar} label="Ngày tạo" value={format(new Date(user.created_at), "dd/MM/yyyy")} />
              <DetailItem icon={Clock} label="Đăng nhập cuối" value={user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm") : 'Chưa đăng nhập'} />
              <div className="flex items-start space-x-3">
                {isBanned ? <Ban className="h-4 w-4 text-red-500 mt-1" /> : <CheckCircle className="h-4 w-4 text-green-500 mt-1" />}
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <Badge className={cn("text-white capitalize", isBanned ? "bg-gray-500" : "bg-green-500")}>{isBanned ? "Ngưng hoạt động" : "Hoạt động"}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};