import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PostType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  word_count: number | null;
}

const PostTypesTab = () => {
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPostType, setEditingPostType] = useState<PostType | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [postTypeToDelete, setPostTypeToDelete] = useState<PostType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [wordCount, setWordCount] = useState<number | ''>('');

  const fetchPostTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('document_post_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError("Không thể tải danh sách dạng bài.");
    } else {
      setPostTypes(data as PostType[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPostTypes();
  }, []);

  const filteredPostTypes = useMemo(() => {
    return postTypes.filter(pt => pt.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [postTypes, searchTerm]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setWordCount('');
  };

  const handleAddNewClick = () => {
    resetForm();
    setEditingPostType(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (postType: PostType) => {
    setEditingPostType(postType);
    setName(postType.name);
    setDescription(postType.description || '');
    setWordCount(postType.word_count || '');
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (postType: PostType) => {
    setPostTypeToDelete(postType);
    setIsDeleteAlertOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return showError("Tên dạng bài không được để trống.");
    setIsSubmitting(true);
    const toastId = showLoading(editingPostType ? "Đang cập nhật..." : "Đang thêm...");

    const payload = { 
      name, 
      description,
      word_count: wordCount === '' ? null : wordCount
    };

    const query = editingPostType
      ? supabase.from('document_post_types').update(payload).eq('id', editingPostType.id)
      : supabase.from('document_post_types').insert(payload);

    const { error } = await query;
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess("Lưu dạng bài thành công!");
      setIsDialogOpen(false);
      fetchPostTypes();
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!postTypeToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('document_post_types').delete().eq('id', postTypeToDelete.id);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa dạng bài thành công!");
      fetchPostTypes();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quản lý Dạng bài</CardTitle>
          <CardDescription>Thêm, sửa, xóa các loại dạng bài để phân loại tài liệu.</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Tìm theo tên dạng bài..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            <Plus className="mr-2 h-4 w-4" />Thêm dạng bài
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên dạng bài</TableHead>
                <TableHead>Số lượng từ</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Đang tải...</TableCell></TableRow>
              ) : filteredPostTypes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Không có dạng bài nào.</TableCell></TableRow>
              ) : (
                filteredPostTypes.map((postType) => (
                  <TableRow key={postType.id}>
                    <TableCell className="font-medium">{postType.name}</TableCell>
                    <TableCell>{postType.word_count || 'N/A'}</TableCell>
                    <TableCell className="max-w-md truncate">{postType.description || <span className="text-gray-400">Không có mô tả</span>}</TableCell>
                    <TableCell>{format(new Date(postType.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(postType)}>
                            <Pencil className="mr-2 h-4 w-4" />Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(postType)}>
                            <Trash2 className="mr-2 h-4 w-4" />Xóa
                          </DropdownMenuItem>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPostType ? 'Sửa dạng bài' : 'Thêm dạng bài mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post-type-name">Tên dạng bài</Label>
              <Input id="post-type-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-type-word-count">Số lượng từ</Label>
              <Input id="post-type-word-count" type="number" value={wordCount} onChange={e => setWordCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="VD: 300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-type-description">Mô tả</Label>
              <Textarea id="post-type-description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa dạng bài "{postTypeToDelete?.name}" không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PostTypesTab;