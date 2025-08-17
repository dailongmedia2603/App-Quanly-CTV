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
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Plus, ExternalLink, Pencil, Trash2 } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  link: string;
  topic: string | null;
}

const CustomerFinderGroupsTab = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [topic, setTopic] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customer_finder_groups').select('*').order('created_at', { ascending: false });
    if (error) showError("Không thể tải danh sách group.");
    else setGroups(data as Group[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const resetForm = () => {
    setName('');
    setLink('');
    setTopic('');
  };

  const handleAddNewClick = () => {
    resetForm();
    setEditingGroup(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setName(group.name);
    setLink(group.link);
    setTopic(group.topic || '');
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setIsDeleteAlertOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !link.trim()) return showError("Tên và link group không được để trống.");
    setIsSubmitting(true);
    const toastId = showLoading(editingGroup ? "Đang cập nhật..." : "Đang thêm...");
    const payload = { name, link, topic };
    const query = editingGroup ? supabase.from('customer_finder_groups').update(payload).eq('id', editingGroup.id) : supabase.from('customer_finder_groups').insert(payload);
    const { error } = await query;
    dismissToast(toastId);
    if (error) showError(`Lưu thất bại: ${error.message}`);
    else {
      showSuccess("Lưu thành công!");
      setIsDialogOpen(false);
      fetchGroups();
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('customer_finder_groups').delete().eq('id', groupToDelete.id);
    dismissToast(toastId);
    if (error) showError(`Xóa thất bại: ${error.message}`);
    else {
      showSuccess("Xóa group thành công!");
      fetchGroups();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Danh sách Group Facebook</CardTitle>
          <CardDescription>Các group chất lượng để tìm kiếm khách hàng tiềm năng.</CardDescription>
        </div>
        {isSuperAdmin && <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />Thêm Group</Button>}
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader><TableRow><TableHead className="w-[50px]">STT</TableHead><TableHead>Tên group</TableHead><TableHead>Chủ đề</TableHead><TableHead className="text-center">Link</TableHead>{isSuperAdmin && <TableHead className="text-right">Hành động</TableHead>}</TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Đang tải...</TableCell></TableRow> : groups.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">Chưa có group nào.</TableCell></TableRow> : (
                groups.map((group, index) => (
                  <TableRow key={group.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.topic || <span className="text-gray-400">Chưa có</span>}</TableCell>
                    <TableCell className="text-center"><Button variant="ghost" size="icon" asChild><a href={group.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-brand-orange" /></a></Button></TableCell>
                    {isSuperAdmin && <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleEditClick(group)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClick(group)}><Trash2 className="h-4 w-4" /></Button></TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingGroup ? 'Sửa thông tin Group' : 'Thêm Group mới'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="group-name">Tên group</Label><Input id="group-name" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="group-link">Link group</Label><Input id="group-link" value={link} onChange={e => setLink(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="group-topic">Chủ đề</Label><Input id="group-topic" value={topic} onChange={e => setTopic(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa group "{groupToDelete?.name}" không?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CustomerFinderGroupsTab;