import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, History, ArrowLeft, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EmailContent {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

const EmailContentHistoryView = ({ onBack }: { onBack: () => void }) => {
  const [history, setHistory] = useState<EmailContent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase.from('email_contents').select('*').order('created_at', { ascending: false });
    if (error) showError("Không thể tải lịch sử.");
    else setHistory(data as EmailContent[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => showSuccess("Đã sao chép!"));
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? history.map(h => h.id) : []);
  };

  const confirmDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    const toastId = showLoading(`Đang xóa ${selectedIds.length} mục...`);
    const { error } = await supabase.from('email_contents').delete().in('id', selectedIds);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa thành công!");
      setSelectedIds([]);
      fetchHistory();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const isAllSelected = history.length > 0 && selectedIds.length === history.length;

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Nội dung mail đã tạo</CardTitle>
            <div className="flex items-center space-x-2">
              {selectedIds.length > 0 && (
                <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})
                </Button>
              )}
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <p>Đang tải...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Chưa có nội dung nào được tạo.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center p-2 border rounded-md bg-gray-50">
                <Checkbox id="select-all" checked={isAllSelected} onCheckedChange={handleSelectAll} />
                <label htmlFor="select-all" className="ml-3 text-sm font-medium">Chọn tất cả</label>
              </div>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {history.map(item => (
                  <AccordionItem value={item.id} key={item.id} className="border border-orange-200 rounded-lg bg-white shadow-sm">
                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                      <div className="flex items-center w-full gap-4">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(c) => handleSelect(item.id, c as boolean)}
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full min-w-0 gap-1 sm:gap-4 text-left">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-sm text-gray-600 truncate">Tiêu đề: {item.subject}</p>
                          </div>
                          <span className="text-sm text-gray-500 font-normal sm:flex-shrink-0 sm:pl-4">
                            {format(new Date(item.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-white rounded-b-lg">
                      <div className="prose max-w-none relative bg-orange-50/30 p-4 rounded-md border border-orange-100">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 text-gray-600 hover:bg-orange-100"
                          onClick={() => handleCopy(item.body)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <h4 className="font-bold !mb-2">Tiêu đề: {item.subject}</h4>
                        <hr className="!my-2" />
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {item.body}
                        </ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa {selectedIds.length} nội dung đã chọn không? Hành động này không thể hoàn tác.
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
    </>
  );
};

export default EmailContentHistoryView;