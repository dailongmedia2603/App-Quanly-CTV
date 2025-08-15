import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { History, FileText, Calendar, Wallet, Percent } from 'lucide-react';

interface OldContract {
  contract_id: string;
  project_name: string;
  start_date: string;
  amount_paid_in_month: number;
  commission_rate: number;
  commission_amount: number;
}

interface OldContractsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contracts: OldContract[];
  loading: boolean;
  month: string;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export const OldContractsDialog = ({ isOpen, onOpenChange, contracts, loading, month }: OldContractsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <History className="h-6 w-6 mr-2 text-brand-orange" />
            Hợp đồng cũ có thanh toán
          </DialogTitle>
          <DialogDescription>
            Danh sách các hợp đồng cũ có ghi nhận thanh toán trong tháng {month}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="flex items-center"><FileText className="h-4 w-4 mr-2" />Tên dự án</TableHead>
                  <TableHead><Calendar className="inline-block h-4 w-4 mr-2" />Tháng bắt đầu HĐ</TableHead>
                  <TableHead><Wallet className="inline-block h-4 w-4 mr-2" />Thanh toán trong tháng {month}</TableHead>
                  <TableHead><Percent className="inline-block h-4 w-4 mr-2" />Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">Đang tải...</TableCell></TableRow>
                ) : contracts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">Không có dữ liệu.</TableCell></TableRow>
                ) : (
                  contracts.map(c => (
                    <TableRow key={c.contract_id}>
                      <TableCell className="font-medium">{c.project_name}</TableCell>
                      <TableCell>{format(new Date(c.start_date), 'MM/yyyy', { locale: vi })}</TableCell>
                      <TableCell>{formatCurrency(c.amount_paid_in_month)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{formatCurrency(c.commission_amount)}</span>
                          <span className="text-xs text-gray-500">({Math.round(c.commission_rate * 100)}%)</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};