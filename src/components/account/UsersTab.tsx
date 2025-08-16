import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReportWidget from '@/components/ReportWidget';
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Users, UserCheck, UserX, Search, Plus, MoreHorizontal, Trash2, Ban, CheckCircle, ShieldCheck } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: any;
}

interface AdminUser extends User {
  banned_until?: string;
  roles: string[];
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

interface UsersTabProps {
  users: AdminUser[];
  allRoles: Role[];
  loading: boolean;
  isSuperAdmin: boolean;
  onUsersAndRolesUpdate: () => void;
}

const UsersTab = ({ users, allRoles, loading, isSuperAdmin, onUsersAndRolesUpdate }: UsersTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);

  // Form states
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  
  // Action states
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [userToEditRoles, setUserToEditRoles] = useState<AdminUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) return showError("Vui lòng nhập email và mật khẩu.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang tạo tài khoản...");
    const { error } = await supabase.functions.invoke("admin-create-user", { body: { email: newUserEmail, password: newUserPassword } });
    dismissToast(toastId);
    if (error) {
      showError(`Tạo tài khoản thất bại: ${error.message}`);
    } else {
      showSuccess("Tạo tài khoản thành công!");
      setIsAddDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      onUsersAndRolesUpdate();
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa tài khoản...");
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: userToDelete.id } });
    
    dismissToast(toastId);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);

    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa tài khoản thành công!");
      onUsersAndRolesUpdate();
    }
    setIsSubmitting(false);
  };

  const handleToggleBanUser = async (user: AdminUser) => {
    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
    const action = isBanned ? "Mở khóa" : "Khóa";
    const updates = { ban_duration: isBanned ? "none" : "inf" };
    setIsSubmitting(true);
    const toastId = showLoading(`Đang ${action.toLowerCase()} tài khoản...`);
    const { error } = await supabase.functions.invoke("admin-update-user", { body: { user_id: user.id, updates } });
    dismissToast(toastId);
    if (error) {
      showError(`${action} thất bại: ${error.message}`);
    } else {
      showSuccess(`${action} tài khoản thành công!`);
      onUsersAndRolesUpdate();
    }
    setIsSubmitting(false);
  };

  const handleEditRolesClick = (user: AdminUser) => {
    setUserToEditRoles(user);
    const currentUserRoleIds = allRoles.filter(role => user.roles.includes(role.name)).map(role => role.id);
    setSelectedRoleIds(currentUserRoleIds);
    setIsRolesDialogOpen(true);
  };

  const handleUpdateUserRoles = async () => {
    if (!userToEditRoles) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang cập nhật quyền...");
    const { error } = await supabase.functions.invoke("admin-set-user-roles", { body: { user_id: userToEditRoles.id, role_ids: selectedRoleIds } });
    dismissToast(toastId);
    if (error) {
      showError(`Cập nhật quyền thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật quyền thành công!");
      onUsersAndRolesUpdate();
    }
    setIsRolesDialogOpen(false);
    setUserToEditRoles(null);
    setIsSubmitting(false);
  };

  const getInitials = (email: string) => (email ? email.charAt(0).toUpperCase() : "P");
  const filteredUsers = useMemo(() => users.filter((user) => user.email?.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
  const stats = useMemo(() => {
    const active = users.filter(u => !u.banned_until || new Date(u.banned_until) < new Date()).length;
    return { total: users.length, active, inactive: users.length - active };
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportWidget icon={<Users className="h-5 w-5" />} title="Tổng tài khoản" value={stats.total.toString()} />
        <ReportWidget icon={<UserCheck className="h-5 w-5" />} title="Đang hoạt động" value={stats.active.toString()} />
        <ReportWidget icon={<UserX className="h-5 w-5" />} title="Ngưng hoạt động" value={stats.inactive.toString()} />
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Tìm kiếm bằng email" className="pl-10 border-orange-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {isSuperAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Thêm tài khoản</span></Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
              <DialogHeader><DialogTitle>Thêm tài khoản mới</DialogTitle><DialogDescription>Tài khoản sẽ được tự động xác thực.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@example.com" /></div>
                <div className="grid gap-2"><Label htmlFor="new-password">Mật khẩu</Label><Input id="new-password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="••••••••" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button><Button onClick={handleAddUser} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang thêm..." : "Thêm"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border border-orange-200 rounded-lg bg-white">
        <Table>
          <TableHeader><TableRow className="bg-gray-50 hover:bg-gray-50"><TableHead>Tài khoản</TableHead><TableHead>Họ và tên</TableHead><TableHead>Số điện thoại</TableHead><TableHead>Vai trò</TableHead><TableHead>Ngày tạo</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Đang tải dữ liệu...</TableCell></TableRow> : filteredUsers.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">Không tìm thấy tài khoản nào.</TableCell></TableRow> : (
              filteredUsers.map((user) => {
                const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                return (
                  <TableRow key={user.id}>
                    <TableCell><div className="flex items-center space-x-3"><Avatar><AvatarImage src={user.user_metadata.avatar_url} /><AvatarFallback className="bg-brand-orange-light text-brand-orange">{getInitials(user.email || "")}</AvatarFallback></Avatar><span className="font-medium">{user.email}</span></div></TableCell>
                    <TableCell>{fullName || <span className="text-gray-400 text-xs">Chưa có</span>}</TableCell>
                    <TableCell>{user.phone || <span className="text-gray-400 text-xs">Chưa có</span>}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{user.roles.length > 0 ? user.roles.map(role => <Badge key={role} variant="secondary">{role}</Badge>) : <span className="text-gray-400 text-xs">Chưa có</span>}</div></TableCell>
                    <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell><Badge className={cn("text-white capitalize", isBanned ? "bg-gray-500" : "bg-green-500")}>{isBanned ? "Ngưng hoạt động" : "Hoạt động"}</Badge></TableCell>
                    <TableCell className="text-right">
                      {isSuperAdmin && (
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRolesClick(user)}><ShieldCheck className="mr-2 h-4 w-4" /><span>Phân quyền</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBanUser(user)} disabled={isSubmitting}>{isBanned ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}<span>{isBanned ? "Mở khóa" : "Khóa"}</span></DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => { setUserToDelete(user); setIsDeleteDialogOpen(true); }} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /><span>Xóa</span></DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Tài khoản của <span className="font-bold">{userToDelete?.email}</span> sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Phân quyền cho {userToEditRoles?.email}</DialogTitle><DialogDescription>Chọn các vai trò bạn muốn gán cho tài khoản này.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-2">
            {allRoles.map(role => (
              <div key={role.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`role-assign-${role.id}`}
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={(checked) => {
                    setSelectedRoleIds(prev => checked ? [...prev, role.id] : prev.filter(id => id !== role.id));
                  }}
                />
                <Label htmlFor={`role-assign-${role.id}`} className="font-medium cursor-pointer">{role.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsRolesDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateUserRoles} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang lưu..." : "Lưu"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersTab;