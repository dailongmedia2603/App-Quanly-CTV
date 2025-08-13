import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/account/UsersTab";
import RolesTab from "@/components/account/RolesTab";
import { Users, ShieldCheck } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: any;
}

interface AdminUser extends User {
  banned_until?: string;
  roles: string[];
}

const Account = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Tài khoản</h1>
        <p className="text-gray-500 mt-1">Thêm, xóa, phân quyền và quản lý các tài khoản người dùng.</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;