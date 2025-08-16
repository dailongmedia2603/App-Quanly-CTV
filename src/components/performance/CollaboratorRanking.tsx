import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { DatePicker } from '../ui/date-picker';
import { Skeleton } from '../ui/skeleton';
import { showError } from '@/utils/toast';
import { format, startOfMonth } from 'date-fns';

interface RankingData {
  full_name: string;
  commission: number;
  contracts: number;
}

const CollaboratorRanking = () => {
  const [ranking, setRanking] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      const formattedMonth = format(month, 'yyyy-MM-dd');
      const { data, error } = await supabase.rpc('get_all_income_stats_for_month', { target_month: formattedMonth });

      if (error) {
        showError(`Không thể tải bảng xếp hạng: ${error.message}`);
      } else {
        const sortedData = data
          .map((user: any) => ({
            full_name: user.full_name,
            commission: user.new_contract_commission + user.old_contract_commission,
            contracts: user.contract_count,
          }))
          .sort((a: RankingData, b: RankingData) => b.commission - a.commission)
          .slice(0, 10);
        setRanking(sortedData);
      }
      setLoading(false);
    };

    fetchRanking();
  }, [month]);

  const renderRank = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Trophy className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="font-bold text-lg">{rank}</span>;
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Xếp hạng Cộng tác viên</CardTitle>
        <CardDescription>
          Top 10 cộng tác viên có hiệu suất cao nhất trong tháng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <p className="font-medium">Chọn tháng:</p>
          <DatePicker
            date={month}
            setDate={(d) => d && setMonth(startOfMonth(d))}
          />
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Hạng</TableHead>
                <TableHead>Tên Cộng tác viên</TableHead>
                <TableHead className="text-right">Tổng hoa hồng</TableHead>
                <TableHead className="text-right">Số hợp đồng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length > 0 ? (
                ranking.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-bold text-lg flex justify-center items-center h-full">
                      {renderRank(index + 1)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.commission)}
                    </TableCell>
                    <TableCell className="text-right">{user.contracts}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Không có dữ liệu xếp hạng trong tháng này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CollaboratorRanking;