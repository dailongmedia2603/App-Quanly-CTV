import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ReportWidget from '@/components/ReportWidget';
import { Wallet, Landmark, Percent, FileText, Calendar as CalendarIcon, Handshake } from 'lucide-react';
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Define the contract type
interface Contract {
  id: string;
  project_name: string;
  contract_value: number;
  commission_rate: number;
  status: 'ongoing' | 'completed';
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  commission_paid: boolean;
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const Income = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;
      setLoading(true);

      const from = startOfMonth(selectedDate).toISOString();
      const to = endOfMonth(selectedDate).toISOString();

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', from)
        .lte('start_date', to);

      if (error) {
        console.error("Error fetching contracts:", error);
        setContracts([]);
      } else {
        setContracts(data as Contract[]);
      }
      setLoading(false);
    };

    fetchContracts();
  }, [user, selectedDate]);

  const stats = useMemo(() => {
    const fixedSalary = 5000000; // Hardcoded for now
    const totalCommission = contracts.reduce((acc, contract) => {
      return acc + (contract.contract_value * contract.commission_rate);
    }, 0);
    const totalIncome = fixedSalary + totalCommission;
    const contractCount = contracts.length;

    return { totalIncome, fixedSalary, totalCommission, contractCount };
  }, [contracts]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedDate(currentDate => {
      return direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thu nhập</h1>
        <p className="text-gray-500 mt-1">
          Theo dõi và quản lý thu nhập của bạn.
        </p>
      </div>

      <Tabs defaultValue="income">
        <TabsList className="flex w-full max-w-md rounded-lg border border-orange-200 bg-white overflow-hidden">
          <TabsTrigger
            value="income"
            className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-none"
          >
            <Wallet className="h-4 w-4" />
            <span>Thu nhập</span>
          </TabsTrigger>
          <TabsTrigger
            value="contracts"
            className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-none"
          >
            <Handshake className="h-4 w-4" />
            <span>Hợp đồng</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => handleMonthChange('prev')}>Tháng trước</Button>
              <Button variant="outline" onClick={() => handleMonthChange('next')}>Tháng sau</Button>
            </div>
            <div className="text-lg font-semibold flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-600" />
              <span>{format(selectedDate, 'MMMM yyyy', { locale: vi })}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportWidget icon={<Wallet className="h-5 w-5" />} title="Tổng thu nhập" value={formatCurrency(stats.totalIncome)} />
            <ReportWidget icon={<Landmark className="h-5 w-5" />} title="Lương cứng" value={formatCurrency(stats.fixedSalary)} />
            <ReportWidget icon={<Percent className="h-5 w-5" />} title="Hoa hồng" value={formatCurrency(stats.totalCommission)} />
            <ReportWidget icon={<FileText className="h-5 w-5" />} title="Hợp đồng" value={stats.contractCount.toString()} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách hợp đồng trong tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên dự án</TableHead>
                    <TableHead>Giá trị hợp đồng</TableHead>
                    <TableHead>Hoa hồng</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Đã thanh toán</TableHead>
                    <TableHead>Hoa hồng đã nhận</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Đang tải...</TableCell></TableRow>
                  ) : contracts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Không có hợp đồng nào trong tháng này.</TableCell></TableRow>
                  ) : (
                    contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.project_name}</TableCell>
                        <TableCell>{formatCurrency(contract.contract_value)}</TableCell>
                        <TableCell>{formatCurrency(contract.contract_value * contract.commission_rate)}</TableCell>
                        <TableCell>
                          <Badge variant={contract.status === 'completed' ? 'default' : 'secondary'} className={cn(contract.status === 'completed' && 'bg-green-500 text-white')}>{contract.status === 'completed' ? 'Hoàn thành' : 'Đang chạy'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contract.payment_status === 'paid' ? 'default' : 'outline'} className={cn(contract.payment_status === 'paid' && 'bg-blue-500 text-white')}>{contract.payment_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contract.commission_paid ? 'default' : 'destructive'} className={cn(contract.commission_paid && 'bg-green-100 text-green-800')}>{contract.commission_paid ? 'Đã nhận' : 'Chưa nhận'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Hợp đồng</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Tính năng đang được phát triển. Vui lòng quay lại sau.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Income;