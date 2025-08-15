import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
}

interface PaymentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contractId: string | null;
  onPaymentsUpdate: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const formatNumberWithDots = (value: number | string) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = String(value).replace(/\./g, '');
  if (isNaN(Number(num))) return '';
  return new Intl.NumberFormat('de-DE').format(Number(num));
};
const parseFormattedNumber = (value: string) => Number(String(value).replace(/\./g, ''));

export const PaymentDetailsDialog = ({ isOpen, onOpenChange, contractId, onPaymentsUpdate }: PaymentDetailsDialogProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAmount, setNewAmount] = useState(0);
  const [newPaymentDate, setNewPaymentDate] = useState<Date | undefined>(new Date());
  const [newNotes, setNewNotes] = useState('');

  const fetchPayments = async () => {
    if (!contractId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('contract_payments')
      .select('*')
      .eq('contract_id', contractId)
      .order('payment_date', { ascending: false });
    if (error) showError("Không thể tải lịch sử thanh toán.");
    else setPayments(data as Payment[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, contractId]);

  const handleAddPayment = async () => {
    if (!contractId || !newPaymentDate || newAmount <= 0) {
      return showError("Vui lòng nhập số tiền và ngày thanh toán hợp lệ.");
    }
    setIsAdding(true);
    const toastId = showLoading("Đang thêm thanh toán...");
    const { error } = await supabase.from('contract_payments').insert({
      contract_id: contractId,
      amount: newAmount,
      payment_date: newPaymentDate.toISOString(),
      notes: newNotes,
    });
    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess("Thêm thanh toán thành công!");
      setNewAmount(0);
      setNewNotes('');
      setNewPaymentDate(new Date());
      fetchPayments();
      onPaymentsUpdate(); // Notify parent to refetch contract data
    }
    setIsAdding(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('contract_payments').delete().eq('id', paymentId);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa thanh toán thành công!");
      fetchPayments();
      onPaymentsUpdate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lịch sử thanh toán</DialogTitle>
          <DialogDescription>Xem và quản lý các lần thanh toán cho hợp đồng này.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="border p-4 rounded-lg space-y-4">
            <h3 className="font-semibold">Thêm thanh toán mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label htmlFor="amount">Số tiền (VND)</Label><Input id="amount" type="text" value={formatNumberWithDots(newAmount)} onChange={e => setNewAmount(parseFormattedNumber(e.target.value))} /></div>
              <div className="space-y-2"><Label htmlFor="payment_date">Ngày thanh toán</Label><DatePicker date={newPaymentDate} setDate={setNewPaymentDate} /></div>
              <div className="space-y-2"><Label htmlFor="notes">Ghi chú</Label><Input id="notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} /></div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddPayment} disabled={isAdding} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />{isAdding ? 'Đang thêm...' : 'Thêm'}</Button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lịch sử</h3>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader><TableRow><TableHead>Ngày</TableHead><TableHead>Số tiền</TableHead><TableHead>Ghi chú</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={4} className="text-center">Đang tải...</TableCell></TableRow> : payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center">Chưa có thanh toán nào.</TableCell></TableRow> : (
                    payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.payment_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                        <TableCell>{p.notes}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeletePayment(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};