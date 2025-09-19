import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Plus, ExternalLink, Pencil, Trash2, Folder, FolderPlus, Move, Upload, FileText } from 'lucide-react';
import * as XLSX from "xlsx";

interface Group {
  id: string;
  group_name: string | null;
  group_id: string | null;
  category_id: string | null;
  origin: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  list_nguon_facebook: Group[];
}

const ListGroupTab = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [categories, setCategories] = useState<Category[]>([]);
  const [ungrouped, setUngrouped] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'group', data: Category | Group } | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [catRes, ungroupedRes] = await Promise.all([
      supabase.from('facebook_group_categories').select('*, list_nguon_facebook(*)').order('name'),
      supabase.from('list_nguon_facebook').select('*').is('category_id', null).order('created_at', { ascending: false })
    ]);
    if (catRes.error) showError("Không thể tải danh mục."); else setCategories(catRes.data as Category[]);
    if (ungroupedRes.error) showError("Không thể tải group chưa phân loại."); else setUngrouped(ungroupedRes.data as Group[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    setIsSubmitting(true);
    const toastId = showLoading(editingCategory ? "Đang cập nhật..." : "Đang tạo...");
    const query = editingCategory
      ? supabase.from('facebook_group_categories').update({ name: categoryName }).eq('id', editingCategory.id)
      : supabase.from('facebook_group_categories').insert({ name: categoryName });
    const { error } = await query;
    dismissToast(toastId);
    if (error) showError("Lưu thất bại.");
    else { showSuccess("Lưu thành công!"); setIsCategoryDialogOpen(false); fetchData(); }
    setIsSubmitting(false);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim() || !groupId.trim()) return;
    setIsSubmitting(true);
    const toastId = showLoading(editingGroup ? "Đang cập nhật..." : "Đang thêm...");
    const payload = { group_name: groupName, group_id: groupId, category_id: parentCategoryId, origin: 'Manual' };
    const query = editingGroup
      ? supabase.from('list_nguon_facebook').update(payload).eq('id', editingGroup.id)
      : supabase.from('list_nguon_facebook').insert(payload);
    const { error } = await query;
    dismissToast(toastId);
    if (error) showError("Lưu thất bại.");
    else { showSuccess("Lưu thành công!"); setIsGroupDialogOpen(false); fetchData(); }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { type, data } = itemToDelete;
    const fromTable = type === 'category' ? 'facebook_group_categories' : 'list_nguon_facebook';
    const { error } = await supabase.from(fromTable).delete().eq('id', data.id);
    dismissToast(toastId);
    if (error) showError("Xóa thất bại.");
    else { showSuccess("Xóa thành công!"); fetchData(); }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handleMoveToGroup = async (groupId: string | null) => {
    setIsMovePopoverOpen(false);
    if (selectedIds.length === 0) return;
    const toastId = showLoading("Đang di chuyển...");
    const { error } = await supabase.from('list_nguon_facebook').update({ category_id: groupId }).in('id', selectedIds);
    dismissToast(toastId);
    if (error) showError("Di chuyển thất bại.");
    else { showSuccess("Di chuyển thành công!"); setSelectedIds([]); fetchData(); }
  };

  const handleDownloadTemplate = () => {
    const sampleData = [{ group_id: '123456789012345', group_name: 'Tên group mẫu' }];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "mau_import_group.xlsx");
  };

  const handleImport = async () => {
    if (!importFile) return showError("Vui lòng chọn một file để import.");
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
        if (json.length === 0) throw new Error("File không có dữ liệu.");
        const newGroups = json.map(row => {
          if (!row.group_id || !row.group_name) throw new Error("File phải có 2 cột 'group_id' và 'group_name'.");
          return { group_id: String(row.group_id), group_name: String(row.group_name), origin: 'Import' };
        });
        dismissToast(toastId);
        const insertToastId = showLoading(`Đang import ${newGroups.length} group...`);
        const { error } = await supabase.from('list_nguon_facebook').insert(newGroups);
        dismissToast(insertToastId);
        if (error) throw error;
        showSuccess(`Import thành công ${newGroups.length} group!`);
        setIsImportDialogOpen(false);
        setImportFile(null);
        fetchData();
      } catch (error: any) {
        dismissToast(toastId);
        showError(`Lỗi xử lý file: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsArrayBuffer(importFile);
  };

  const allGroups = useMemo(() => [...categories.flatMap(c => c.list_nguon_facebook), ...ungrouped], [categories, ungrouped]);

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Danh sách Group Facebook</CardTitle>
              <CardDescription>Quản lý các nguồn group để quét bài viết.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {selectedIds.length > 0 && (
                <>
                  <Popover open={isMovePopoverOpen} onOpenChange={setIsMovePopoverOpen}>
                    <PopoverTrigger asChild><Button variant="outline"><Move className="mr-2 h-4 w-4" />Chuyển tới</Button></PopoverTrigger>
                    <PopoverContent className="p-0 w-56"><Command><CommandInput placeholder="Tìm thư mục..." /><CommandList><CommandEmpty>Không tìm thấy.</CommandEmpty><CommandGroup><CommandItem onSelect={() => handleMoveToGroup(null)}>Bỏ phân loại</CommandItem>{categories.map(g => <CommandItem key={g.id} onSelect={() => handleMoveToGroup(g.id)}>{g.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                  </Popover>
                  <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})</Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}><Upload className="mr-2 h-4 w-4" />Import</Button>
              {isSuperAdmin && <Button onClick={() => { setEditingCategory(null); setCategoryName(''); setIsCategoryDialogOpen(true); }} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><FolderPlus className="mr-2 h-4 w-4" />Thêm thư mục</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p>Đang tải...</p> : (
            <Accordion type="multiple" className="w-full space-y-3" defaultValue={['ungrouped', ...categories.map(c => c.id)]}>
              {categories.map(category => <CategoryItem key={category.id} category={category} groups={category.list_nguon_facebook} selectedIds={selectedIds} onSelect={setSelectedIds} onEditCategory={() => { setEditingCategory(category); setCategoryName(category.name); setIsCategoryDialogOpen(true); }} onDeleteCategory={() => { setItemToDelete({ type: 'category', data: category }); setIsDeleteAlertOpen(true); }} onAddGroup={() => { setEditingGroup(null); setGroupName(''); setGroupId(''); setParentCategoryId(category.id); setIsGroupDialogOpen(true); }} onEditGroup={(group) => { setEditingGroup(group); setGroupName(group.group_name || ''); setGroupId(group.group_id || ''); setParentCategoryId(group.category_id); setIsGroupDialogOpen(true); }} onDeleteGroup={(group) => { setItemToDelete({ type: 'group', data: group }); setIsDeleteAlertOpen(true); }} canEdit={isSuperAdmin} />)}
              <CategoryItem category={{ id: 'ungrouped', name: 'Chưa phân loại', list_nguon_facebook: ungrouped }} groups={ungrouped} selectedIds={selectedIds} onSelect={setSelectedIds} onAddGroup={() => { setEditingGroup(null); setGroupName(''); setGroupId(''); setParentCategoryId(null); setIsGroupDialogOpen(true); }} onEditGroup={(group) => { setEditingGroup(group); setGroupName(group.group_name || ''); setGroupId(group.group_id || ''); setParentCategoryId(group.category_id); setIsGroupDialogOpen(true); }} onDeleteGroup={(group) => { setItemToDelete({ type: 'group', data: group }); setIsDeleteAlertOpen(true); }} canEdit={true} />
            </Accordion>
          )}
        </CardContent>
      </Card>
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingCategory ? 'Sửa thư mục' : 'Thêm thư mục mới'}</DialogTitle></DialogHeader><div className="py-4"><Label>Tên thư mục</Label><Input value={categoryName} onChange={e => setCategoryName(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveCategory} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingGroup ? 'Sửa Group' : 'Thêm Group mới'}</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label>Tên group</Label><Input value={groupName} onChange={e => setGroupName(e.target.value)} /></div><div className="space-y-2"><Label>Group ID</Label><Input value={groupId} onChange={e => setGroupId(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveGroup} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa "{itemToDelete ? (itemToDelete.type === 'category' ? (itemToDelete.data as Category).name : (itemToDelete.data as Group).group_name) : ''}" không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}><DialogContent><DialogHeader><DialogTitle>Import Group từ file Excel</DialogTitle><DialogDescription>File phải có 2 cột: 'group_id' và 'group_name'.</DialogDescription></DialogHeader><div className="py-4 space-y-4"><div className="space-y-2"><Label>Chọn file Excel</Label><Input id="import-file" type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} /></div><Button variant="link" onClick={handleDownloadTemplate} className="p-0 h-auto text-brand-orange"><FileText className="h-4 w-4 mr-2" />Tải file mẫu</Button></div><DialogFooter><Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Hủy</Button><Button onClick={handleImport} disabled={isSubmitting || !importFile} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang import..." : "Import"}</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
};

const CategoryItem = ({ category, groups, selectedIds, onSelect, onEditCategory, onDeleteCategory, onAddGroup, onEditGroup, onDeleteGroup, canEdit }: any) => {
  const isAllSelected = groups.length > 0 && groups.every((g: Group) => selectedIds.includes(g.id));
  const handleSelectAll = (checked: boolean) => {
    const groupIds = groups.map((g: Group) => g.id);
    onSelect((prev: string[]) => checked ? [...new Set([...prev, ...groupIds])] : prev.filter(id => !groupIds.includes(id)));
  };

  return (
    <AccordionItem value={category.id} className="border border-orange-100 rounded-lg bg-white/50">
      <AccordionTrigger className="p-4 hover:no-underline">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-3"><Folder className="h-5 w-5 text-brand-orange" />
            <span className="font-semibold text-base text-gray-800">{category.name} ({groups.length})</span>
          </div>
          {canEdit && category.id !== 'ungrouped' && <div className="flex items-center space-x-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEditCategory(); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); onDeleteCategory(); }}><Trash2 className="h-4 w-4" /></Button></div>}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-2 sm:px-4 pb-4">
        <div className="pl-2 sm:pl-4 border-l-2 border-orange-100 space-y-2">
          <div className="flex items-center px-2"><Checkbox id={`select-all-${category.id}`} checked={isAllSelected} onCheckedChange={handleSelectAll} /><label htmlFor={`select-all-${category.id}`} className="ml-2 text-sm font-medium">Chọn tất cả</label></div>
          <Table>
            <TableBody>
              {groups.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center h-16">Chưa có group nào.</TableCell></TableRow> : (
                groups.map((group: Group) => (
                  <TableRow key={group.id}>
                    <TableCell className="w-12"><Checkbox checked={selectedIds.includes(group.id)} onCheckedChange={(c) => onSelect((prev: string[]) => c ? [...prev, group.id] : prev.filter(id => id !== group.id))} /></TableCell>
                    <TableCell className="font-medium">{group.group_name}</TableCell>
                    <TableCell className="font-mono text-gray-600">{group.group_id}</TableCell>
                    <TableCell><a href={`https://www.facebook.com/groups/${group.group_id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-brand-orange" /></a></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditGroup(group)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onDeleteGroup(group)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Button variant="ghost" size="sm" className="mt-2 text-xs text-gray-500" onClick={onAddGroup}><Plus className="h-3 w-3 mr-2" />Thêm Group</Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ListGroupTab;