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

interface QuoteTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

const QuoteTemplatesTab = () => {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<QuoteTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError("Không thể tải danh sách mẫu báo giá.");
    } else {
      setTemplates(data as QuoteTemplate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [templates, searchTerm]);

  const resetForm = () => {
    setName('');
    setContent('');
  };

  const handleAddNewClick = () => {
    resetForm();
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (template: QuoteTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content || '');
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (template: QuoteTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteAlertOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return showError("Tên mẫu không được để trống.");
    if (!content.trim()) return showError("Nội dung mẫu không được để trống.");
    setIsSubmitting(true);
    const toastId = showLoading(editingTemplate ? "Đang cập nhật..." : "Đang thêm...");

    const payload = { name, content };

    const query = editingTemplate
      ? supabase.from('quote_templates').update(payload).eq('id', editingTemplate.id)
      : supabase.from('quote_templates').insert(payload);

    const { error } = await query;
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess("Lưu mẫu báo giá thành công!");
      setIsDialogOpen(false);
      fetchTemplates();
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('quote_templates').delete().eq('id', templateToDelete.id);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa mẫu báo giá thành công!");
      fetchTemplates();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quản lý Mẫu báo giá</CardTitle>
          <CardDescription>Thêm, sửa, xóa các mẫu báo giá để AI tham khảo khi tạo báo giá tự động.</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Tìm theo tên mẫu..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            <Plus className="mr-2 h-4 w-4" />Thêm mẫu
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên mẫu báo giá</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Đang tải...</TableCell></TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Không có mẫu báo giá nào.</TableCell></TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-md truncate">{template.content || <span className="text-gray-400">Không có nội dung</span>}</TableCell>
                    <TableCell>{format(new Date(template.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(template)}>
                            <Pencil className="mr-2 h-4 w-4" />Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(template)}>
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
            <DialogTitle>{editingTemplate ? 'Sửa mẫu báo giá' : 'Thêm mẫu báo giá mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Tên mẫu</Label>
              <Input id="template-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Nội dung</Label>
              <Textarea id="template-content" value={content} onChange={e => setContent(e.target.value)} className="min-h-[200px]" />
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
              Bạn có chắc muốn xóa mẫu báo giá "{templateToDelete?.name}" không? Hành động này không thể hoàn tác.
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

export default QuoteTemplatesTab;