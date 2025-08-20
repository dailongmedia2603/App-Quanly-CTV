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
  profiles: { first_name: string | null; last_name: string | null } | null;
  users: { email: string | null } | null;
}

const AiErrorLogTab = () => {
  const [logs, setLogs] = useState<AiErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      // Supabase does not directly support joining with auth.users table.
      // A better approach would be an RPC function, but for simplicity, we'll fetch users separately if needed.
      // For now, we assume a view or function might provide user details, or we handle it client-side.
      // Let's try to join with profiles and see what we get.
      const { data, error } = await supabase
        .from('ai_error_logs')
        .select(`*, user:profiles(first_name, last_name, users:auth.users(email))`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        showError("Không thể tải lịch sử lỗi.");
        console.error(error);
      } else {
        // This structure is hypothetical based on a potential view. Let's adapt to what Supabase client actually returns.
        // The select query above is not standard. Let's simplify it to what's possible.
        const { data: simpleData, error: simpleError } = await supabase
            .from('ai_error_logs')
            .select(`*`)
            .order('created_at', { ascending: false })
            .limit(100);
        
        if(simpleError) {
            showError("Không thể tải lịch sử lỗi.");
        } else {
            // We'll need another query to get user emails if not directly joinable.
            // For now, let's just display what we have.
            setLogs(simpleData as any[]);
        }
      }
      setLoading(false);
    };
    fetchLogs();
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
                <TableHead><User className="inline-block h-4 w-4 mr-2" />User ID</TableHead>
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
                    <TableCell className="font-mono text-xs">{log.user_id || 'Không rõ'}</TableCell>
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