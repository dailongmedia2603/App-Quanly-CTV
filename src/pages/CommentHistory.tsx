import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { History, ArrowLeft, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Log {
  id: string;
  created_at: string;
  generated_content: string;
}

const getCommentSnippet = (content: string): string => {
  if (!content) return 'Comment không có nội dung';
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 100) {
    return firstLine.substring(0, 100) + '...';
  }
  return firstLine || 'Comment không có nội dung';
};

const CommentHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_generation_logs')
        .select('id, created_at, generated_content')
        .eq('template_type', 'comment')
        .order('created_at', { ascending: false });

      if (error) {
        showError("Không thể tải lịch sử comment.");
        console.error(error);
      } else {
        setLogs(data as Log[]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const handleCopy = (content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      showSuccess("Đã sao chép comment!");
    }).catch(err => {
      showError("Không thể sao chép.");
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold">Comment đã tạo</h1>
            <p className="text-gray-500 mt-1">Xem lại các comment bạn đã tạo trước đây.</p>
        </div>
        <Button onClick={() => navigate('/create-content/comment')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
        </Button>
      </div>
      <Card className="border-orange-200">
        <CardHeader>
            <CardTitle>Lịch sử</CardTitle>
            <CardDescription>Danh sách các comment đã được tạo bởi AI.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500 py-10">Đang tải lịch sử...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 font-medium">Chưa có comment nào được tạo</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {logs.map(log => (
                <AccordionItem value={log.id} key={log.id} className="bg-white border border-orange-200 rounded-lg shadow-sm">
                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                    <div className="flex justify-between items-center w-full min-w-0 gap-4">
                      <span className="font-medium text-left text-gray-800 truncate">{getCommentSnippet(log.generated_content)}</span>
                      <span className="text-sm text-gray-500 font-normal flex-shrink-0">
                        {format(new Date(log.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-white rounded-b-lg">
                    <div className="prose max-w-none relative bg-orange-50/30 p-4 rounded-md border border-orange-100">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 text-gray-600 hover:bg-orange-100"
                        onClick={() => handleCopy(log.generated_content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.generated_content}</ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentHistory;