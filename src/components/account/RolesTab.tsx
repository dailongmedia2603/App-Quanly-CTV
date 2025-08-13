import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { Plus, Info, Pencil, Trash2 } from "lucide-react";
import { permissionConfig, actionNames } from "@/lib/permissions";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: any;
}

interface RolesTabProps {
  allRoles: Role[];
  loading: boolean;
  onUsersAndRolesUpdate: () => void;
}

const PROTECTED_ROLES = ['Super Admin', 'Admin', 'User'];

const RolesTab = ({ allRoles, loading, onUsersAndRolesUpdate }: RolesTabProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionUpdates, setPermissionUpdates] = useState<Record<string, any>>({});
  
  // Dialog states
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const handlePermissionChange = (roleId: string, featureKey: string, action: string, checked: boolean) => {
    setPermissionUpdates(prev => {
      const currentRole = allRoles.find(r => r.id === roleId);
      const newPermissions = { ...(prev[roleId] || currentRole?.permissions || {}) };
      
      if (newPermissions.super_admin) {
        const fullPermissions: Record<string, string[]> = {};
        permissionConfig.forEach(group => {
          fullPermissions[group.key] = group.actions;
        });
        Object.assign(newPermissions, fullPermissions);
        delete newPermissions.super_admin;
      }

      const featureActions = newPermissions[featureKey] || [];
      if (checked) {
        if (!featureActions.includes(action)) {
          newPermissions[featureKey] = [...featureActions, action];
        }
      } else {
        newPermissions[featureKey] = featureActions.filter((a: string) => a !== action);
      }
      return { ...prev, [roleId]: newPermissions };
    });
  };

  const handleSaveRolePermissions = async (roleId: string) => {
    const permissions = permissionUpdates[roleId];
    if (!permissions) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang lưu quyền...");
    const { error } = await supabase.functions.invoke("admin-update-role", { body: { role_id: roleId, permissions } });
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess("Lưu quyền thành công!");
      setPermissionUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[roleId];
        return newUpdates;
      });
      onUsersAndRolesUpdate();
    }
    setIsSubmitting(false);
  };

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

  const handleDeleteRoleClick = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteAlertOpen(true);
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
      onUsersAndRolesUpdate();
      setIsRoleDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa vai trò...");
    const { error } = await supabase.functions.invoke("admin-delete-role", { body: { role_id: roleToDelete.id } });
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa vai trò thành công!");
      onUsersAndRolesUpdate();
    }
    setIsDeleteAlertOpen(false);
    setRoleToDelete(null);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAddNewRoleClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Thêm vai trò mới
        </Button>
      </div>
      <Accordion type="multiple" className="w-full space-y-3">
        {allRoles.map(role => {
          const currentPermissions = permissionUpdates[role.id] || role.permissions || {};
          const isSuperAdminRole = role.name === 'Super Admin' || currentPermissions.super_admin;
          const hasPermissionChanges = !!permissionUpdates[role.id];
          const isProtected = PROTECTED_ROLES.includes(role.name);

          return (
            <AccordionItem value={role.id} key={role.id} className="border border-orange-100 rounded-lg bg-white/50">
              <AccordionTrigger className="p-4 hover:no-underline">
                <div className="flex justify-between items-center w-full">
                  <div className="text-left">
                    <p className="font-semibold text-base text-gray-800">{role.name}</p>
                    <p className="text-sm text-gray-500 font-normal">{role.description}</p>
                  </div>
                  {!isProtected && (
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditRoleClick(role); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteRoleClick(role); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 px-4 text-sm">
                {isSuperAdminRole ? (
                  <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
                    <Info className="h-5 w-5" />
                    <span>Vai trò Super Admin có tất cả các quyền và không thể chỉnh sửa.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                      {permissionConfig.map(group => (
                        <div key={group.key} className="space-y-2">
                          <h4 className="font-semibold text-gray-800 border-b pb-1">{group.name}</h4>
                          <div className="space-y-1">
                            {group.actions.map(action => {
                              const isChecked = currentPermissions[group.key]?.includes(action);
                              return (
                                <div key={action} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${role.id}-${group.key}-${action}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handlePermissionChange(role.id, group.key, action, checked as boolean)}
                                  />
                                  <Label htmlFor={`${role.id}-${group.key}-${action}`} className="font-normal text-gray-700">{actionNames[action]}</Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasPermissionChanges && (
                      <div className="flex justify-end pt-2">
                        <Button size="sm" onClick={() => handleSaveRolePermissions(role.id)} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                          {isSubmitting ? "Đang lưu..." : `Lưu quyền cho vai trò ${role.name}`}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRole ? 'Sửa vai trò' : 'Tạo vai trò mới'}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div><Label htmlFor="role-name">Tên vai trò</Label><Input id="role-name" value={roleName} onChange={e => setRoleName(e.target.value)} disabled={editingRole && PROTECTED_ROLES.includes(editingRole.name)} /></div>
            <div><Label htmlFor="role-desc">Mô tả</Label><Textarea id="role-desc" value={roleDescription} onChange={e => setRoleDescription(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveRole} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang lưu..." : "Lưu"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn vai trò "{roleToDelete?.name}". Các tài khoản đang có vai trò này sẽ bị mất quyền.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteRole} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesTab;