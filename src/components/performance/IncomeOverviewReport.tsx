import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from '@/utils/toast';
import { format, startOfMonth } from 'date-fns';
import { DollarSign, Landmark, FileText, Users } from 'lucide-react';

interface IncomeStat {
  user_id: string;
  full_name: string;
  fixed_salary: number;
  new_contract_commission: number;
  old_contract_commission: number;
  total_income: number;
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const IncomeOverviewReport = () => {
  const [stats, setStats] = useState<IncomeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const formattedMonth = format(month, 'yyyy-MM-dd');
      const { data, error } = await supabase.rpc('get_all_income_stats_for_month', { target_month: formattedMonth });

      if (error) {
        showError(`Không thể tải dữ liệu thu nhập: ${error.message}`);
        console.error(error);
      } else {
        setStats(data as IncomeStat[]);
      }
      setLoading(false);
    };

    fetchStats();
  }, [month]);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, user) => {
        acc.totalIncome += user.total_income;
        acc.totalFixedSalary += user.fixed_salary;
        acc.totalCommission += user.new_contract_commission + user.old_contract_commission;
        return acc;
      },
      { totalIncome: 0, totalFixedSalary: 0, totalCommission: 0 }
    );
  }, [stats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Tổng quan Thu nhập</CardTitle>
        <CardDescription>
          Báo cáo chi tiết về lương, hoa hồng và thu nhập của các cộng tác viên.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <p className="font-medium">Chọn tháng:</p>
          <DatePicker
            date={month}
            onChange={(d) => d && setMonth(startOfMonth(d))}
            isMonthPicker
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Tổng thu nhập" value={formatCurrency(totals.totalIncome)} icon={DollarSign} />
            <StatCard title="Tổng lương cứng" value={formatCurrency(totals.totalFixedSalary)} icon={Landmark} />
            <StatCard title="Tổng hoa hồng" value={formatCurrency(totals.totalCommission)} icon={FileText} />
            <StatCard title="Số CTV có thu nhập" value={stats.length.toString()} icon={Users} />
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cộng tác viên</TableHead>
                <TableHead className="text-right">Lương cứng</TableHead>
                <TableHead className="text-right">Hoa hồng HĐ mới</TableHead>
                <TableHead className="text-right">Hoa hồng HĐ cũ</TableHead>
                <TableHead className="text-right font-bold">Tổng thu nhập</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length > 0 ? (
                stats.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.fixed_salary)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.new_contract_commission)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.old_contract_commission)}</TableCell>
                    <TableCell className="text-right font-bold text-brand-orange">{formatCurrency(user.total_income)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Không có dữ liệu thu nhập trong tháng này.
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

export default IncomeOverviewReport;