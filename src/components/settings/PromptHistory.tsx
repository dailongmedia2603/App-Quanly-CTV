import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trash2, User, Clock, RefreshCw, FileText, BrainCircuit } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface Log {
  id: string;
  created_at: string;
  final_prompt: string;
  generated_content: string;
  user_email: string;
}

interface PromptHistoryProps {
  templateType: 'post' | 'comment' | 'consulting';
}

const PromptHistory = ({ templateType }: PromptHistoryProps) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-generation-logs', {
      body: { template_type: templateType }
    });
    
    if (error) {
      showError(`Không thể tải lịch sử: ${error.message}`);
      setLogs([]);
    } else {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [templateType]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedLogs(checked ? logs.map(log => log.id) : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedLogs.length === 0) return;
    setIsDeleting(true);
    const toastId = showLoading(`Đang xóa ${selectedLogs.length} mục...`);
    const { error } = await supabase.functions.invoke('delete-generation-logs', {
      body: { log_ids: selectedLogs }
    });
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess('Xóa thành công!');
      setSelectedLogs([]);
      fetchLogs();
    }
    setIsDeleting(false);
    setIsDeleteAlertOpen(false);
  };

  const isAllSelected = logs.length > 0 && selectedLogs.length === logs.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Lịch sử tạo</CardTitle>
            <CardDescription>Các prompt đã được tạo và kết quả trả về.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}><RefreshCw className="h-4 w-4" /></Button>
            {selectedLogs.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Xóa ({selectedLogs.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 font-medium">Chưa có lịch sử nào</p>
            <p className="text-sm">Lịch sử sẽ xuất hiện ở đây sau khi có người tạo nội dung.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center p-2 border-b">
              <Checkbox id="select-all" checked={isAllSelected} onCheckedChange={handleSelectAll} />
              <label htmlFor="select-all" className="ml-3 text-sm font-medium">Chọn tất cả</label>
            </div>
            <Accordion type="multiple" className="w-full">
              {logs.map(log => (
                <AccordionItem value={log.id} key={log.id} className="border-b">
                  <div className="flex items-center p-2">
                    <Checkbox
                      checked={selectedLogs.includes(log.id)}
                      onCheckedChange={(checked) => {
                        setSelectedLogs(prev => checked ? [...prev, log.id] : prev.filter(id => id !== log.id));
                      }}
                      className="mt-1"
                    />
                    <AccordionTrigger className="flex-1 hover:no-underline p-2">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{log.user_email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(log.created_at), 'dd/MM/yyyy, HH:mm', { locale: vi })}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><BrainCircuit className="h-4 w-4 mr-2 text-brand-orange" />Prompt đã gửi</h4>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs whitespace-pre-wrap font-sans">{log.final_prompt}</pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center"><FileText className="h-4 w-4 mr-2 text-brand-orange" />Kết quả trả về</h4>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs whitespace-pre-wrap font-sans">{log.generated_content}</pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Bạn sẽ xóa vĩnh viễn {selectedLogs.length} mục đã chọn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Đang xóa..." : "Xác nhận xóa"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PromptHistory;