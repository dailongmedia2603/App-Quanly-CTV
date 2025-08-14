import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { Info, Pencil, Trash2 } from "lucide-react";
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
  onEditRole: (role: Role) => void;
  isSuperAdmin: boolean;
}

const PROTECTED_ROLES = ['Super Admin'];

const RolesTab = ({ allRoles, loading, onUsersAndRolesUpdate, onEditRole, isSuperAdmin }: RolesTabProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionUpdates, setPermissionUpdates] = useState<Record<string, any>>({});
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

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

  const handleEditRoleClick = (role: Role) => {
    onEditRole(role);
  };

  const handleDeleteRoleClick = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteAlertOpen(true);
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
                  {isSuperAdmin && !isProtected && (
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn vai trò "{roleToDelete?.name}". Các tài khoản đang có vai trò này sẽ bị mất quyền.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteRole} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesTab;