import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, History, ArrowLeft } from 'lucide-react';

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

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase.from('email_contents').select('*').order('created_at', { ascending: false });
      if (error) showError("Không thể tải lịch sử.");
      else setHistory(data as EmailContent[]);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, []);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => showSuccess("Đã sao chép!"));
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Nội dung mail đã tạo</CardTitle>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingHistory ? (
          <p>Đang tải...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Chưa có nội dung nào được tạo.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {history.map(item => (
              <AccordionItem value={item.id} key={item.id} className="border border-orange-200 rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full min-w-0 gap-1 sm:gap-4 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600 truncate">Tiêu đề: {item.subject}</p>
                    </div>
                    <span className="text-sm text-gray-500 font-normal sm:flex-shrink-0 sm:pl-4">
                      {format(new Date(item.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                    </span>
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
        )}
      </CardContent>
    </Card>
  );
};

export default EmailContentHistoryView;