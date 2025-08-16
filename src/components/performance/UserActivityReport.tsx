import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from '@/utils/toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DatePicker } from '../ui/date-picker';
import { Label } from '../ui/label';
import { format, subDays } from 'date-fns';

interface UserActivityStat {
  user_id: string;
  full_name: string;
  email: string;
  post_count: number;
  comment_count: number;
  consulting_session_count: number;
  total_messages_count: number;
  active_days_count: number;
}

const UserActivityReport = () => {
  const [stats, setStats] = useState<UserActivityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_activity_stats', {
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) {
        showError(`Không thể tải dữ liệu hoạt động: ${error.message}`);
        console.error(error);
      } else {
        setStats(data as UserActivityStat[]);
      }
      setLoading(false);
    };

    fetchStats();
  }, [dateRange]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Hoạt động User</CardTitle>
        <CardDescription>
          Phân tích tần suất và các hành động chính của người dùng trên hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="grid gap-2">
            <Label>Từ ngày</Label>
            <DatePicker date={dateRange.from} setDate={(date) => date && setDateRange(prev => ({ ...prev, from: date }))} />
          </div>
          <div className="grid gap-2">
            <Label>Đến ngày</Label>
            <DatePicker date={dateRange.to} setDate={(date) => date && setDateRange(prev => ({ ...prev, to: date }))} />
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cộng tác viên</TableHead>
                <TableHead className="text-center">Bài viết</TableHead>
                <TableHead className="text-center">Comment</TableHead>
                <TableHead className="text-center">Phiên tư vấn</TableHead>
                <TableHead className="text-center">Tổng tin nhắn</TableHead>
                <TableHead className="text-center">Ngày hoạt động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{user.post_count}</TableCell>
                  <TableCell className="text-center font-semibold">{user.comment_count}</TableCell>
                  <TableCell className="text-center font-semibold">{user.consulting_session_count}</TableCell>
                  <TableCell className="text-center font-semibold">{user.total_messages_count}</TableCell>
                  <TableCell className="text-center font-semibold">{user.active_days_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserActivityReport;