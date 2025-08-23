import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Plus, Trash2, Users, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmailListContactsDialog } from './EmailListContactsDialog';

interface EmailList {
  id: string;
  name: string;
  created_at: string;
  contact_count: number;
}

const EmailListsTab = () => {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listToDelete, setListToDelete] = useState<EmailList | null>(null);
  const [isContactsDialogOpen, setIsContactsDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const fetchLists = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_lists').select('id, name, created_at, email_list_contacts(count)');
    if (error) {
      showError("Không thể tải danh sách email.");
    } else {
      const formattedData = data.map((list: any) => ({
        ...list,
        contact_count: list.email_list_contacts[0]?.count || 0,
      }));
      setLists(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleSave = async () => {
    if (!listName.trim()) return showError("Tên danh sách không được để trống.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang lưu...");
    const { error } = await supabase.from('email_lists').insert({ name: listName });
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess("Tạo danh sách thành công!");
      setIsDialogOpen(false);
      setListName('');
      fetchLists();
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!listToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('email_lists').delete().eq('id', listToDelete.id);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa danh sách thành công!");
      fetchLists();
    }
    setListToDelete(null);
    setIsSubmitting(false);
  };

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách Email</CardTitle>
            <CardDescription>Quản lý các danh sách email của bạn để gửi chiến dịch.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            <Plus className="mr-2 h-4 w-4" />Tạo danh sách mới
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader><TableRow><TableHead>Tên danh sách</TableHead><TableHead>Số lượng liên hệ</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Đang tải...</TableCell></TableRow> : lists.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">Chưa có danh sách nào.</TableCell></TableRow> : (
                  lists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">{list.name}</TableCell>
                      <TableCell>{list.contact_count}</TableCell>
                      <TableCell>{format(new Date(list.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedListId(list.id); setIsContactsDialogOpen(true); }}><Users className="mr-2 h-4 w-4" />Quản lý liên hệ</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setListToDelete(list)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Tạo danh sách mới</DialogTitle></DialogHeader><div className="py-4"><Label htmlFor="list-name">Tên danh sách</Label><Input id="list-name" value={listName} onChange={e => setListName(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent>
      </Dialog>
      <AlertDialog open={!!listToDelete} onOpenChange={() => setListToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa danh sách "{listToDelete?.name}" không? Tất cả liên hệ trong danh sách này cũng sẽ bị xóa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <EmailListContactsDialog listId={selectedListId} isOpen={isContactsDialogOpen} onOpenChange={setIsContactsDialogOpen} onContactsUpdate={fetchLists} />
    </>
  );
};

export default EmailListsTab;