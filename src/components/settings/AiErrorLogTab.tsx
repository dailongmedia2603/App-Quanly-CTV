import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertTriangle, User, Code, Clock } from 'lucide-react';

interface AiErrorLog {
  id: string;
  created_at: string;
  error_message: string;
  function_name: string;
  user_id: string;
  user_display?: string;
}

const AiErrorLogTab = () => {
  const [logs, setLogs] = useState<AiErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogsAndUsers = async () => {
      setLoading(true);
      try {
        const [logsRes, usersRes] = await Promise.all([
          supabase
            .from('ai_error_logs')
            .select(`*`)
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.functions.invoke("admin-get-users-with-roles")
        ]);

        const { data: logsData, error: logsError } = logsRes;
        if (logsError) throw logsError;

        const { data: usersData, error: usersError } = usersRes;
        if (usersError) throw usersError;

        const userMap = new Map(usersData.users.map((u: any) => {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          return [u.id, fullName || u.email];
        }));

        const enrichedLogs = logsData.map((log: any) => ({
          ...log,
          user_display: userMap.get(log.user_id) || log.user_id || 'Không rõ'
        }));

        setLogs(enrichedLogs);

      } catch (error: any) {
        showError("Không thể tải lịch sử lỗi.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogsAndUsers();
  }, []);

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Lịch sử lỗi AI</CardTitle>
        <CardDescription>Ghi nhận các lỗi xảy ra khi người dùng sử dụng các tính năng tạo nội dung bằng AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><User className="inline-block h-4 w-4 mr-2" />Người dùng</TableHead>
                <TableHead><AlertTriangle className="inline-block h-4 w-4 mr-2" />Thông báo lỗi</TableHead>
                <TableHead><Code className="inline-block h-4 w-4 mr-2" />Chức năng</TableHead>
                <TableHead><Clock className="inline-block h-4 w-4 mr-2" />Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Chưa có lỗi nào được ghi nhận.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.user_display}</TableCell>
                    <TableCell className="text-red-600">{log.error_message}</TableCell>
                    <TableCell>{log.function_name}</TableCell>
                    <TableCell>{format(new Date(log.created_at), 'dd/MM/yy, HH:mm:ss', { locale: vi })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiErrorLogTab;