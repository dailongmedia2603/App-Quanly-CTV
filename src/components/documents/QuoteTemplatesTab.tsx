import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Search, Plus, Trash2, FileText, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return showError("Vui lòng điền đầy đủ tên và nội dung mẫu.");
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
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    const toastId = showLoading(`Đang xóa ${selectedIds.length} mẫu...`);
    const { error } = await supabase.from('quote_templates').delete().in('id', selectedIds);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa mẫu báo giá thành công!");
      setSelectedIds([]);
      fetchTemplates();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredTemplates.map(d => d.id) : []);
  };

  const isAllFilteredSelected = filteredTemplates.length > 0 && selectedIds.length === filteredTemplates.length;

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Danh sách Mẫu báo giá</CardTitle>
            <CardDescription>Quản lý các mẫu báo giá để AI tham khảo.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Tìm theo tên mẫu..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {selectedIds.length > 0 ? (
              <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})
              </Button>
            ) : (
              <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                <Plus className="mr-2 h-4 w-4" />Thêm mẫu
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 font-medium">Không có mẫu báo giá nào</p>
            <p className="text-sm">Hãy thêm mẫu mới để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center p-4 border rounded-lg bg-gray-50">
              <Checkbox id="select-all" checked={isAllFilteredSelected} onCheckedChange={handleSelectAll} />
              <label htmlFor="select-all" className="ml-3 text-sm font-medium">Chọn tất cả ({filteredTemplates.length})</label>
            </div>
            <Accordion type="multiple" className="w-full space-y-2">
              {filteredTemplates.map(template => (
                <AccordionItem value={template.id} key={template.id} className="border border-orange-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-gray-50/50 w-full text-left data-[state=open]:border-b data-[state=open]:border-orange-200">
                    <div className="flex items-center w-full gap-4">
                      <Checkbox
                        checked={selectedIds.includes(template.id)}
                        onCheckedChange={(c) => handleSelect(template.id, c as boolean)}
                        onClick={e => e.stopPropagation()}
                        className="flex-shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{template.name}</p>
                        <p className="text-xs text-gray-500">{format(new Date(template.created_at), 'dd/MM/yyyy')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditClick(template); }}
                        className="flex-shrink-0 text-gray-600 hover:text-brand-orange"
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Sửa
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-brand-orange-light/30">
                    <div className="space-y-4 bg-white/50 p-4 rounded-md border border-orange-100 text-sm">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><FileText className="h-4 w-4 mr-2 text-brand-orange"/>Nội dung chi tiết</h4>
                        <pre className="font-sans whitespace-pre-wrap text-gray-800">{template.content || <em>Không có nội dung.</em>}</pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingTemplate ? 'Sửa mẫu báo giá' : 'Thêm mẫu báo giá mới'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="template-name">Tên mẫu</Label><Input id="template-name" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="template-content">Nội dung chi tiết</Label><Textarea id="template-content" value={content} onChange={e => setContent(e.target.value)} className="min-h-[200px]" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa {selectedIds.length} mẫu đã chọn không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default QuoteTemplatesTab;