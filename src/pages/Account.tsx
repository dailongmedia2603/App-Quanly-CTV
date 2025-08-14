import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/account/UsersTab";
import RolesTab from "@/components/account/RolesTab";
import { Users, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

const PROTECTED_ROLES_FOR_EDIT = ['Super Admin', 'Admin', 'User'];

const Account = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  // State lifted from RolesTab
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-get-users-with-roles");
    if (error) {
      showError("Không thể tải danh sách người dùng và quyền.");
    } else {
      setUsers(data.users);
      setAllRoles(data.allRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  // Logic lifted from RolesTab
  const handleAddNewRoleClick = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setIsRoleDialogOpen(true);
  };

  const handleEditRoleClick = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return showError("Tên vai trò không được để trống.");
    setIsSubmitting(true);
    const toastId = showLoading(editingRole ? "Đang cập nhật..." : "Đang tạo...");

    let error;
    if (editingRole) {
      const updates = { role_id: editingRole.id, name: roleName, description: roleDescription };
      ({ error } = await supabase.functions.invoke("admin-update-role", { body: updates }));
    } else {
      ({ error } = await supabase.functions.invoke("admin-create-role", { body: { name: roleName, description: roleDescription } }));
    }

    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess(`Lưu vai trò thành công!`);
      fetchUsersAndRoles();
      setIsRoleDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Tài khoản</h1>
        <p className="text-gray-500 mt-1">Thêm, xóa, phân quyền và quản lý các tài khoản người dùng.</p>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full grid-cols-2 max-w-md rounded-lg border border-orange-200 p-0 bg-white">
            <TabsTrigger value="users" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
              <Users className="h-4 w-4" />
              <span>Danh sách tài khoản</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
              <ShieldCheck className="h-4 w-4" />
              <span>Phân quyền</span>
            </TabsTrigger>
          </TabsList>
          {activeTab === 'roles' && (
            <Button onClick={handleAddNewRoleClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="mr-2 h-4 w-4" /> Thêm vai trò mới
            </Button>
          )}
        </div>
        <TabsContent value="users" className="pt-6">
          <UsersTab 
            users={users} 
            allRoles={allRoles} 
            loading={loading} 
            isSuperAdmin={isSuperAdmin} 
            onUsersAndRolesUpdate={fetchUsersAndRoles} 
          />
        </TabsContent>
        <TabsContent value="roles" className="pt-6">
          <RolesTab 
            allRoles={allRoles}
            loading={loading}
            onUsersAndRolesUpdate={fetchUsersAndRoles}
            onEditRole={handleEditRoleClick}
            isSuperAdmin={isSuperAdmin}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div><Label htmlFor="role-name">Tên vai trò</Label><Input id="role-name" value={roleName} onChange={e => setRoleName(e.target.value)} disabled={editingRole && PROTECTED_ROLES_FOR_EDIT.includes(editingRole.name)} /></div>
            <div><Label htmlFor="role-desc">Mô tả</Label><Textarea id="role-desc" value={roleDescription} onChange={e => setRoleDescription(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveRole} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang lưu..." : "Lưu"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;