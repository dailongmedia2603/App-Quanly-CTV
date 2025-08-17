import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Plus, ExternalLink, Pencil, Trash2, Folder, FolderPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  link: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  customer_finder_groups: Group[];
}

const CustomerFinderGroupsTab = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'group', data: Category | Group } | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_finder_group_categories')
      .select('*, customer_finder_groups(*)')
      .order('created_at', { ascending: true });
    if (error) showError("Không thể tải dữ liệu.");
    else setCategories(data as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    setIsSubmitting(true);
    const toastId = showLoading(editingCategory ? "Đang cập nhật..." : "Đang tạo...");
    const query = editingCategory
      ? supabase.from('customer_finder_group_categories').update({ name: categoryName }).eq('id', editingCategory.id)
      : supabase.from('customer_finder_group_categories').insert({ name: categoryName });
    const { error } = await query;
    dismissToast(toastId);
    if (error) showError("Lưu thất bại.");
    else { showSuccess("Lưu thành công!"); setIsCategoryDialogOpen(false); fetchData(); }
    setIsSubmitting(false);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim() || !groupLink.trim() || !parentCategoryId) return;
    setIsSubmitting(true);
    const toastId = showLoading(editingGroup ? "Đang cập nhật..." : "Đang thêm...");
    const payload = { name: groupName, link: groupLink, category_id: parentCategoryId };
    const query = editingGroup
      ? supabase.from('customer_finder_groups').update(payload).eq('id', editingGroup.id)
      : supabase.from('customer_finder_groups').insert(payload);
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
    const fromTable = type === 'category' ? 'customer_finder_group_categories' : 'customer_finder_groups';
    const { error } = await supabase.from(fromTable).delete().eq('id', data.id);
    dismissToast(toastId);
    if (error) showError("Xóa thất bại.");
    else { showSuccess("Xóa thành công!"); fetchData(); }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Danh sách Group Facebook</CardTitle>
          <CardDescription>Các group chất lượng được phân loại theo từng nhóm để tìm kiếm khách hàng.</CardDescription>
        </div>
        {isSuperAdmin && <Button onClick={() => { setEditingCategory(null); setCategoryName(''); setIsCategoryDialogOpen(true); }} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><FolderPlus className="mr-2 h-4 w-4" />Thêm Nhóm Group</Button>}
      </CardHeader>
      <CardContent>
        {loading ? <p>Đang tải...</p> : categories.length === 0 ? <p className="text-center text-gray-500 py-8">Chưa có nhóm group nào.</p> : (
          <Accordion type="multiple" className="w-full space-y-3" defaultValue={categories.map(c => c.id)}>
            {categories.map(category => (
              <AccordionItem value={category.id} key={category.id} className="border border-orange-100 rounded-lg bg-white/50">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-3"><Folder className="h-5 w-5 text-brand-orange" /><span className="font-semibold text-base text-gray-800">{category.name}</span></div>
                    {isSuperAdmin && <div className="flex items-center space-x-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditingCategory(category); setCategoryName(category.name); setIsCategoryDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); setItemToDelete({ type: 'category', data: category }); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button></div>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="pl-8 border-l-2 border-orange-100">
                    <Table>
                      <TableHeader><TableRow><TableHead className="w-[50px]">STT</TableHead><TableHead>Tên group</TableHead><TableHead className="text-center">Link</TableHead>{isSuperAdmin && <TableHead className="text-right">Hành động</TableHead>}</TableRow></TableHeader>
                      <TableBody>
                        {category.customer_finder_groups.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-16">Chưa có group nào trong nhóm này.</TableCell></TableRow> : (
                          category.customer_finder_groups.map((group, index) => (
                            <TableRow key={group.id}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{group.name}</TableCell><TableCell className="text-center"><Button variant="ghost" size="icon" asChild><a href={group.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-brand-orange" /></a></Button></TableCell>{isSuperAdmin && <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingGroup(group); setGroupName(group.name); setGroupLink(group.link); setParentCategoryId(group.category_id); setIsGroupDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-red-500" onClick={() => { setItemToDelete({ type: 'group', data: group }); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button></TableCell>}</TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {isSuperAdmin && <Button variant="ghost" size="sm" className="mt-2 text-xs text-gray-500" onClick={() => { setEditingGroup(null); setGroupName(''); setGroupLink(''); setParentCategoryId(category.id); setIsGroupDialogOpen(true); }}><Plus className="h-3 w-3 mr-2" />Thêm Group vào nhóm này</Button>}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingCategory ? 'Sửa Nhóm Group' : 'Thêm Nhóm Group mới'}</DialogTitle></DialogHeader><div className="py-4"><Label htmlFor="cat-name">Tên nhóm</Label><Input id="cat-name" value={categoryName} onChange={e => setCategoryName(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveCategory} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingGroup ? 'Sửa Group' : 'Thêm Group mới'}</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label htmlFor="group-name">Tên group</Label><Input id="group-name" value={groupName} onChange={e => setGroupName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="group-link">Link group</Label><Input id="group-link" value={groupLink} onChange={e => setGroupLink(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveGroup} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa "{itemToDelete?.data.name}" không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </Card>
  );
};

export default CustomerFinderGroupsTab;