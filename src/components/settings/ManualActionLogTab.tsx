import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { History, User, Code, Clock, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface ManualActionLog {
  id: string;
  created_at: string;
  action_type: string;
  request_url: string;
  request_body: any;
  response_status: number;
  response_body: any;
  user_email: string;
}

const ManualActionLogTab = () => {
  const [logs, setLogs] = useState<ManualActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-manual-action-logs');
        if (error) throw error;
        setLogs(data);
      } catch (error: any) {
        showError(`Không thể tải lịch sử hành động: ${error.message}`);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Lịch sử Hành động Thủ công</CardTitle>
        <CardDescription>Ghi nhận các hành động thủ công được thực hiện bởi người dùng, ví dụ như đăng comment.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 font-medium">Chưa có hành động nào được ghi nhận.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-2">
            {logs.map(log => (
              <AccordionItem value={log.id} key={log.id} className="border border-orange-100 rounded-lg bg-white/50">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      {log.response_status >= 200 && log.response_status < 300 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{log.action_type}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                          <span className="flex items-center"><User className="h-3 w-3 mr-1.5" />{log.user_email}</span>
                          <span className="flex items-center"><Clock className="h-3 w-3 mr-1.5" />{format(new Date(log.created_at), 'dd/MM/yy, HH:mm:ss', { locale: vi })}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={log.response_status >= 200 && log.response_status < 300 ? 'default' : 'destructive'} className={cn(log.response_status >= 200 && log.response_status < 300 && 'bg-green-500')}>
                      Status: {log.response_status}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center"><Code className="h-4 w-4 mr-2 text-brand-orange" />Request</h4>
                      <p className="text-xs font-mono bg-white p-2 rounded-md break-all">{log.request_url}</p>
                      <pre className="text-xs whitespace-pre-wrap break-all bg-white p-2 rounded-md mt-2 max-h-60 overflow-auto">{JSON.stringify(log.request_body, null, 2)}</pre>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center"><Server className="h-4 w-4 mr-2 text-brand-orange" />Response</h4>
                      <pre className="text-xs whitespace-pre-wrap break-all bg-white p-2 rounded-md max-h-60 overflow-auto">{JSON.stringify(log.response_body, null, 2)}</pre>
                    </div>
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

export default ManualActionLogTab;