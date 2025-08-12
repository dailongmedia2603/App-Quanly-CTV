import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Upload,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface FacebookGroup {
  id: string;
  group_name: string | null;
  group_id: string | null;
  created_at: string;
  origin: string | null;
}

const DataSourceFacebook = () => {
  const [groups, setGroups] = useState<FacebookGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for adding
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGroupId, setNewGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  
  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FacebookGroup | null>(null);
  const [updatedGroupId, setUpdatedGroupId] = useState("");
  const [updatedGroupName, setUpdatedGroupName] = useState("");

  // State for deleting
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<FacebookGroup | null>(null);

  // State for importing
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("list_nguon_facebook")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
      showError("Không thể tải danh sách group.");
    } else {
      setGroups(data as FacebookGroup[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async () => {
    if (!newGroupId) {
      showError("Vui lòng nhập ID của group.");
      return;
    }
    if (!newGroupName) {
      showError("Vui lòng nhập tên của group.");
      return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Đang thêm group...");

    const { error } = await supabase
      .from("list_nguon_facebook")
      .insert([{ group_id: newGroupId, group_name: newGroupName, origin: "Manual" }]);

    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess("Thêm group thành công!");
      setIsAddDialogOpen(false);
      setNewGroupId("");
      setNewGroupName("");
      fetchGroups();
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (group: FacebookGroup) => {
    setEditingGroup(group);
    setUpdatedGroupId(group.group_id || "");
    setUpdatedGroupName(group.group_name || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !updatedGroupId) {
        showError("Thông tin không hợp lệ.");
        return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Đang cập nhật group...");

    const { error } = await supabase
      .from("list_nguon_facebook")
      .update({ group_id: updatedGroupId, group_name: updatedGroupName })
      .eq("id", editingGroup.id);

    dismissToast(toastId);
    if (error) {
        showError(`Cập nhật thất bại: ${error.message}`);
    } else {
        showSuccess("Cập nhật group thành công!");
        setIsEditDialogOpen(false);
        setEditingGroup(null);
        fetchGroups();
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (group: FacebookGroup) => {
    setGroupToDelete(group);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa group...");

    const { error } = await supabase
      .from("list_nguon_facebook")
      .delete()
      .eq("id", groupToDelete.id);

    dismissToast(toastId);
    if (error) {
        showError(`Xóa thất bại: ${error.message}`);
    } else {
        showSuccess("Xóa group thành công!");
        fetchGroups();
    }
    setIsDeleteAlertOpen(false);
    setGroupToDelete(null);
    setIsSubmitting(false);
  };

  const handleDownloadTemplate = () => {
    const sampleData = [{ group_id: '123456789012345', group_name: 'Tên group mẫu' }];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "mau_import_group.xlsx");
  };

  const handleImport = () => {
    if (!importFile) {
      showError("Vui lòng chọn một file để import.");
      return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Đang xử lý file...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as { group_id: string; group_name: string }[];

        if (json.length === 0) {
          dismissToast(toastId);
          showError("File không có dữ liệu.");
          setIsSubmitting(false);
          return;
        }

        const newGroups = json.map(row => {
          if (!row.group_id || !row.group_name) {
            throw new Error("File phải có 2 cột 'group_id' và 'group_name'.");
          }
          return {
            group_id: String(row.group_id),
            group_name: String(row.group_name),
            origin: 'Import'
          };
        });

        dismissToast(toastId);
        const insertToastId = showLoading(`Đang import ${newGroups.length} group...`);

        const { error } = await supabase.from('list_nguon_facebook').insert(newGroups);

        dismissToast(insertToastId);
        if (error) {
          showError(`Import thất bại: ${error.message}`);
        } else {
          showSuccess(`Import thành công ${newGroups.length} group!`);
          setIsImportDialogOpen(false);
          setImportFile(null);
          fetchGroups();
        }
      } catch (error: any) {
        dismissToast(toastId);
        showError(`Lỗi xử lý file: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsArrayBuffer(importFile);
  };

  const filteredGroups = groups.filter((group) =>
    group.group_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nguồn Group Facebook</h1>
        <p className="text-gray-500 mt-1">
          Quản lý danh sách các group Facebook muốn theo dõi để lấy dữ liệu.
        </p>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm bằng Group ID"
            className="pl-10 border-orange-200 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 border-orange-200">
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
              <DialogHeader>
                <DialogTitle>Import Group từ file Excel</DialogTitle>
                <DialogDescription>
                  Chọn file .xlsx hoặc .csv để import hàng loạt. File phải có 2 cột: 'group_id' và 'group_name'.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Chọn file</Label>
                  <Label htmlFor="import-file" className="w-full cursor-pointer">
                    <div className="flex items-center justify-between w-full h-10 px-3 text-sm border rounded-md border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {importFile ? importFile.name : "No file chosen"}
                      </span>
                      <div className="px-3 py-1 ml-4 text-sm font-semibold rounded-md shrink-0 bg-brand-orange-light text-brand-orange hover:bg-orange-200">
                        Choose File
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="import-file"
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                <Button variant="link" onClick={handleDownloadTemplate} className="text-brand-orange justify-start p-0 h-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Tải file mẫu
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Hủy</Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isSubmitting || !importFile}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                >
                  {isSubmitting ? "Đang import..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Thêm Group</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
              <DialogHeader>
                <DialogTitle>Thêm nguồn Group Facebook mới</DialogTitle>
                <DialogDescription>
                  Nhập ID và tên của group Facebook bạn muốn theo dõi.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-group-id">Group ID</Label>
                  <Input
                    id="new-group-id"
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    placeholder="Nhập ID của group"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-group-name">Tên Group</Label>
                  <Input
                    id="new-group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nhập tên của group"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                <Button 
                  onClick={handleAddGroup} 
                  disabled={isSubmitting}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                >
                  {isSubmitting ? "Đang thêm..." : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-orange-200 rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Group ID</TableHead>
              <TableHead>Tên Group</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead className="text-right w-[120px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Không tìm thấy group nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="text-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-mono text-gray-600">{group.group_id || "N/A"}</TableCell>
                  <TableCell>{group.group_name || "N/A"}</TableCell>
                  <TableCell>
                    {format(new Date(group.created_at), 'dd/MM/yy HH:mm')}
                  </TableCell>
                  <TableCell>{group.origin}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(group)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(group)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sửa thông tin Group</DialogTitle>
            <DialogDescription>
              Cập nhật ID và tên cho group Facebook.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-group-id">Group ID</Label>
              <Input
                id="edit-group-id"
                value={updatedGroupId}
                onChange={(e) => setUpdatedGroupId(e.target.value)}
                placeholder="Nhập ID của group"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-group-name">Tên Group</Label>
              <Input
                id="edit-group-name"
                value={updatedGroupName}
                onChange={(e) => setUpdatedGroupName(e.target.value)}
                placeholder="Nhập tên của group"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateGroup} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn group khỏi danh sách của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-end space-x-4 text-sm font-medium">
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200" disabled>
          Trước
        </Button>
        <span className="text-gray-800">Trang 1</span>
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200">
          Sau
        </Button>
      </div>
    </div>
  );
};

export default DataSourceFacebook;