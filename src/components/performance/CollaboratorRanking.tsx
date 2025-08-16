import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '../ui/button';
import { showError } from '@/utils/toast';
import { Skeleton } from '../ui/skeleton';

interface RankingData {
  rank: number;
  full_name: string;
  email: string;
  total_income: number;
  contract_count: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getInitials = (name: string) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const CollaboratorRanking = () => {
  const [rankingData, setRankingData] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_income_stats_for_month', {
        target_month: format(selectedDate, 'yyyy-MM-dd'),
      });

      if (error) {
        showError(`Không thể tải bảng xếp hạng: ${error.message}`);
        setRankingData([]);
      } else {
        const sortedData = (data || [])
          .sort((a: any, b: any) => b.total_income - a.total_income)
          .slice(0, 10)
          .map((user: any, index: number) => ({ ...user, rank: index + 1 }));
        setRankingData(sortedData);
      }
      setLoading(false);
    };

    fetchRankingData();
  }, [selectedDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedDate(currentDate => direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Award className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Award className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-yellow-700" />;
    return rank;
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Xếp hạng Cộng tác viên</CardTitle>
          <CardDescription>
            Top 10 cộng tác viên có hiệu suất cao nhất trong tháng.
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-lg font-semibold w-32 text-center capitalize">{format(selectedDate, 'MMMM yyyy', { locale: vi })}</span>
            <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Hạng</TableHead>
              <TableHead>Tên Cộng tác viên</TableHead>
              <TableHead className="text-right">Tổng thu nhập</TableHead>
              <TableHead className="text-right">Số hợp đồng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                  <TableCell><div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : rankingData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">Không có dữ liệu cho tháng này.</TableCell>
              </TableRow>
            ) : (
              rankingData.map(user => (
                <TableRow key={user.rank}>
                  <TableCell className="font-bold text-lg w-16">
                    <div className="flex items-center justify-center h-10 w-10">
                      {getRankIcon(user.rank)}
                    </div>
                  </TableCell>
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
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(user.total_income)}
                  </TableCell>
                  <TableCell className="text-right">{user.contract_count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CollaboratorRanking;