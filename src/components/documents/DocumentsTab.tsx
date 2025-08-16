import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Search, Plus, Trash2, FileText, BrainCircuit, Briefcase, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Service {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  content: string | null;
  service_id: string | null;
  ai_prompt: string | null;
  created_at: string;
  document_services: { name: string } | null;
}

const DocumentsTab = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    const [docsRes, servicesRes] = await Promise.all([
      supabase.from('documents').select('*, document_services(name)').order('created_at', { ascending: false }),
      supabase.from('document_services').select('*').order('name', { ascending: true })
    ]);

    if (docsRes.error) showError("Không thể tải tài liệu.");
    else setDocuments(docsRes.data as Document[]);

    if (servicesRes.error) showError("Không thể tải danh sách dịch vụ.");
    else setServices(servicesRes.data as Service[]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const searchMatch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const serviceMatch = selectedServiceFilter === 'all' || doc.service_id === selectedServiceFilter;
      return searchMatch && serviceMatch;
    });
  }, [documents, searchTerm, selectedServiceFilter]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAiPrompt('');
    setSelectedServiceId(undefined);
  };

  const handleAddNewClick = () => {
    resetForm();
    setEditingDocument(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (doc: Document) => {
    setEditingDocument(doc);
    setTitle(doc.title);
    setContent(doc.content || '');
    setAiPrompt(doc.ai_prompt || '');
    setSelectedServiceId(doc.service_id || undefined);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedServiceId) return showError("Vui lòng điền tên tài liệu và chọn dịch vụ.");
    setIsSubmitting(true);
    const toastId = showLoading(editingDocument ? "Đang cập nhật..." : "Đang thêm...");

    const payload = {
      title,
      content,
      ai_prompt: aiPrompt,
      service_id: selectedServiceId,
    };

    const query = editingDocument
      ? supabase.from('documents').update(payload).eq('id', editingDocument.id)
      : supabase.from('documents').insert(payload);

    const { error } = await query;
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess("Lưu tài liệu thành công!");
      setIsDialogOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    const toastId = showLoading(`Đang xóa ${selectedIds.length} tài liệu...`);
    const { error } = await supabase.from('documents').delete().in('id', selectedIds);
    
    dismissToast(toastId);
    setIsDeleteAlertOpen(false);

    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa tài liệu thành công!");
      setSelectedIds([]);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredDocuments.map(d => d.id) : []);
  };

  const isAllFilteredSelected = filteredDocuments.length > 0 && selectedIds.length === filteredDocuments.length;

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Danh sách Tài liệu</CardTitle>
            <CardDescription>Quản lý các tài liệu và mẫu nội dung của bạn.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Tìm theo tên tài liệu..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={selectedServiceFilter} onValueChange={setSelectedServiceFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Lọc theo dịch vụ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả dịch vụ</SelectItem>
                {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedIds.length > 0 ? (
              <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})
              </Button>
            ) : (
              <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                <Plus className="mr-2 h-4 w-4" />Thêm tài liệu
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
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 font-medium">Không có tài liệu nào</p>
            <p className="text-sm">Hãy thêm tài liệu mới để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center p-4 border rounded-lg bg-gray-50">
              <Checkbox id="select-all" checked={isAllFilteredSelected} onCheckedChange={handleSelectAll} />
              <label htmlFor="select-all" className="ml-3 text-sm font-medium">Chọn tất cả ({filteredDocuments.length})</label>
            </div>
            <Accordion type="multiple" className="w-full space-y-2">
              {filteredDocuments.map(doc => (
                <AccordionItem value={doc.id} key={doc.id} className="border border-orange-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-gray-50/50 w-full text-left data-[state=open]:border-b data-[state=open]:border-orange-200">
                    <div className="flex items-center w-full gap-4">
                      <Checkbox
                        checked={selectedIds.includes(doc.id)}
                        onCheckedChange={(c) => handleSelect(doc.id, c as boolean)}
                        onClick={e => e.stopPropagation()}
                        className="flex-shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500">{format(new Date(doc.created_at), 'dd/MM/yyyy')}</p>
                      </div>
                      {doc.document_services?.name && (
                        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 flex-shrink-0">
                          {doc.document_services.name}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditClick(doc); }}
                        className="flex-shrink-0 text-gray-600 hover:text-brand-orange"
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Sửa
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-brand-orange-light/30">
                    <div className="space-y-4 bg-white/50 p-4 rounded-md border border-orange-100 text-sm">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><BrainCircuit className="h-4 w-4 mr-2 text-brand-orange"/>Yêu cầu AI khi đọc</h4>
                        <p className="text-gray-700 italic">{doc.ai_prompt || 'Không có yêu cầu.'}</p>
                      </div>
                      <hr className="border-orange-100"/>
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><FileText className="h-4 w-4 mr-2 text-brand-orange"/>Nội dung chi tiết</h4>
                        <pre className="font-sans whitespace-pre-wrap text-gray-800">{doc.content || <em>Không có nội dung.</em>}</pre>
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
          <DialogHeader><DialogTitle>{editingDocument ? 'Sửa tài liệu' : 'Thêm tài liệu mới'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="doc-title" className="flex items-center"><FileText className="h-4 w-4 mr-2"/>Tên tài liệu</Label><Input id="doc-title" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="doc-service" className="flex items-center"><Briefcase className="h-4 w-4 mr-2"/>Dịch vụ</Label><Select value={selectedServiceId} onValueChange={setSelectedServiceId}><SelectTrigger id="doc-service"><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 col-span-2"><Label htmlFor="doc-ai-prompt" className="flex items-center"><BrainCircuit className="h-4 w-4 mr-2"/>Yêu cầu AI khi đọc</Label><Textarea id="doc-ai-prompt" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="VD: Tóm tắt nội dung, trích xuất các ý chính..." /></div>
            <div className="space-y-2 col-span-2"><Label htmlFor="doc-content">Nội dung chi tiết</Label><Textarea id="doc-content" value={content} onChange={e => setContent(e.target.value)} className="min-h-[200px]" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa {selectedIds.length} tài liệu đã chọn không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DocumentsTab;