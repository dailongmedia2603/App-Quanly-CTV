import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trash2, Clock, RefreshCw, FileText, BrainCircuit, Bot } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface Log {
  id: string;
  created_at: string;
  final_prompt: string;
  generated_content: string;
  user_email: string;
}

interface PromptHistoryProps {
  templateType: 'post' | 'comment' | 'consulting' | 'customer_finder_comment' | 'quote' | 'email';
}

const getSnippet = (content: string | null, maxLength = 120): string => {
  if (!content) return 'Không có nội dung được tạo.';
  const plainText = content
    .replace(/#+\s/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[.*?\]\(.*?\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength) + '...';
};

const PromptHistory = ({ templateType }: PromptHistoryProps) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [logToDelete, setLogToDelete] = useState<Log | null>(null);
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

  const handleDeleteClick = (log: Log) => {
    setLogToDelete(log);
  };

  const confirmDelete = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    const toastId = showLoading(`Đang xóa mục...`);
    const { error } = await supabase.functions.invoke('delete-generation-logs', {
      body: { log_ids: [logToDelete.id] }
    });
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess('Xóa thành công!');
      setLogToDelete(null);
      fetchLogs();
    }
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
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
          <Accordion type="multiple" className="w-full space-y-2">
            {logs.map(log => (
              <AccordionItem value={log.id} key={log.id} className="border border-orange-100 rounded-lg bg-white/50">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      <Bot className="h-5 w-5 text-brand-orange flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{log.user_email}</p>
                        <p className="text-sm text-gray-500 font-normal mt-1">{getSnippet(log.generated_content)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0 ml-4">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(log.created_at), 'dd/MM/yy, HH:mm', { locale: vi })}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center"><BrainCircuit className="h-4 w-4 mr-2 text-brand-orange" />Prompt đã gửi</h4>
                      <pre className="bg-white p-3 rounded-md text-xs whitespace-pre-wrap font-sans">{log.final_prompt}</pre>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center"><FileText className="h-4 w-4 mr-2 text-brand-orange" />Kết quả trả về</h4>
                      <pre className="bg-white p-3 rounded-md text-xs whitespace-pre-wrap font-sans">{log.generated_content}</pre>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(log)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa lịch sử này
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
      <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Lịch sử tạo này sẽ bị ẩn khỏi trang quản trị.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Đang xóa..." : "Xác nhận xóa"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PromptHistory;