import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ReportWidget from '@/components/ReportWidget';
import { Wallet, Landmark, Percent, FileText, Handshake, ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader, CheckCircle, CalendarPlus } from 'lucide-react';
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';

// Define the contract type
interface Contract {
  id: string;
  project_name: string;
  contract_value: number;
  commission_rate: number;
  status: 'ongoing' | 'completed';
  commission_paid: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  paid_amount: number;
  contract_link: string | null;
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatNumberWithDots = (value: number | string) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = String(value).replace(/\./g, '');
  if (isNaN(Number(num))) return '';
  return new Intl.NumberFormat('de-DE').format(Number(num));
};

const parseFormattedNumber = (value: string) => {
  return Number(String(value).replace(/\./g, ''));
};

const Income = () => {
  const { user } = useAuth();
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [contractValue, setContractValue] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0.05);
  const [status, setStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [commissionPaid, setCommissionPaid] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [contractLink, setContractLink] = useState('');

  useEffect(() => {
    if (contractValue > 40000000) {
      setCommissionRate(0.10);
    } else if (contractValue >= 20000000) {
      setCommissionRate(0.07);
    } else {
      setCommissionRate(0.05);
    }
  }, [contractValue]);

  const fetchAllContracts = async () => {
    if (!user) return;
    setLoadingAll(true);
    const { data, error } = await supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      showError("Không thể tải danh sách hợp đồng.");
      setAllContracts([]);
    } else {
      setAllContracts(data as Contract[]);
    }
    setLoadingAll(false);
  };

  useEffect(() => {
    fetchAllContracts();
  }, [user]);

  const monthlyContracts = useMemo(() => {
    if (!allContracts) return [];
    const from = startOfMonth(selectedDate);
    const to = endOfMonth(selectedDate);
    return allContracts.filter(contract => {
        const contractStartDate = new Date(contract.start_date);
        return contractStartDate >= from && contractStartDate <= to;
    });
  }, [allContracts, selectedDate]);

  const monthlyStats = useMemo(() => {
    const totalContractValue = monthlyContracts.reduce((acc, contract) => acc + contract.contract_value, 0);
    
    let fixedSalary = 0;
    if (totalContractValue > 40000000) {
      fixedSalary = 3000000;
    } else if (totalContractValue >= 20000000) {
      fixedSalary = 2000000;
    } else if (totalContractValue > 10000000) {
      fixedSalary = 1000000;
    }

    let monthlyCommissionRate = 0.05; // Mức mặc định: dưới 20.000.000đ
    if (totalContractValue >= 40000000) {
      monthlyCommissionRate = 0.10;
    } else if (totalContractValue >= 20000000) {
      monthlyCommissionRate = 0.07;
    }
    
    const totalCommission = totalContractValue * monthlyCommissionRate;
    const totalIncome = fixedSalary + totalCommission;
    const contractCount = monthlyContracts.length;
    return { totalIncome, fixedSalary, totalCommission, contractCount };
  }, [monthlyContracts]);

  const allContractsStats = useMemo(() => {
    const total = allContracts.length;
    const ongoing = allContracts.filter(c => c.status === 'ongoing').length;
    const completed = allContracts.filter(c => c.status === 'completed').length;
    const thisMonth = allContracts.filter(c => new Date(c.created_at) >= startOfMonth(new Date())).length;
    return { total, ongoing, completed, thisMonth };
  }, [allContracts]);

  const filteredContracts = useMemo(() => {
    return allContracts.filter(c => c.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allContracts, searchTerm]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedDate(currentDate => direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const resetForm = () => {
    setProjectName(''); setContractValue(0); setStatus('ongoing');
    setCommissionPaid(false); setStartDate(new Date()); setEndDate(undefined);
    setContractLink('');
  };

  const handleAddNewClick = () => {
    resetForm();
    setEditingContract(null);
    setIsContractDialogOpen(true);
  };

  const handleEditClick = (contract: Contract) => {
    setEditingContract(contract);
    setProjectName(contract.project_name);
    setContractValue(contract.contract_value);
    setCommissionRate(contract.commission_rate);
    setStatus(contract.status);
    setCommissionPaid(contract.commission_paid);
    setStartDate(new Date(contract.start_date));
    setEndDate(contract.end_date ? new Date(contract.end_date) : undefined);
    setContractLink(contract.contract_link || '');
    setIsContractDialogOpen(true);
  };

  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteAlertOpen(true);
  };

  const handleSaveContract = async () => {
    if (!user || !projectName || !startDate) return showError("Vui lòng điền đầy đủ thông tin bắt buộc.");
    setIsSubmitting(true);
    const toastId = showLoading(editingContract ? "Đang cập nhật..." : "Đang tạo...");
    
    const payload = {
      user_id: user.id,
      project_name: projectName,
      contract_value: contractValue,
      commission_rate: commissionRate,
      status,
      commission_paid: commissionPaid,
      start_date: startDate.toISOString(),
      end_date: endDate?.toISOString() || null,
      contract_link: contractLink,
    };

    const query = editingContract
      ? supabase.from('contracts').update(payload).eq('id', editingContract.id)
      : supabase.from('contracts').insert(payload);

    const { error } = await query;
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess("Lưu hợp đồng thành công!");
      setIsContractDialogOpen(false);
      fetchAllContracts();
    }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('contracts').delete().eq('id', contractToDelete.id);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa hợp đồng thành công!");
      fetchAllContracts();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handleFieldUpdate = async (contractId: string, updates: Partial<Contract>) => {
    const toastId = showLoading("Đang cập nhật...");
    const { error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', contractId);
    
    dismissToast(toastId);
    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật thành công!");
      setAllContracts(prev => 
        prev.map(c => c.id === contractId ? { ...c, ...updates } : c)
      );
    }
  };

  const EditableCurrencyCell = ({ contract, onUpdate }: { contract: Contract; onUpdate: (id: string, updates: Partial<Contract>) => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(contract.paid_amount);
  
    const handleSave = () => {
      if (value !== contract.paid_amount) {
        onUpdate(contract.id, { paid_amount: value });
      }
      setIsEditing(false);
    };
  
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setValue(contract.paid_amount);
        setIsEditing(false);
      }
    };
  
    if (isEditing) {
      return (
        <Input
          type="text"
          value={formatNumberWithDots(value)}
          onChange={(e) => setValue(parseFormattedNumber(e.target.value))}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8"
        />
      );
    }
  
    return (
      <div onClick={() => setIsEditing(true)} className="cursor-pointer p-2 min-h-[40px]">
        {formatCurrency(value)}
      </div>
    );
  };

  const EditableStatusCell = ({ contract, onUpdate }: { contract: Contract; onUpdate: (id: string, updates: Partial<Contract>) => void }) => {
    const handleStatusChange = (newStatus: 'ongoing' | 'completed') => {
      if (newStatus !== contract.status) {
        onUpdate(contract.id, { status: newStatus });
      }
    };
  
    return (
      <Select value={contract.status} onValueChange={handleStatusChange}>
        <SelectTrigger className={cn(
          "w-[120px] border-0 focus:ring-0 focus:ring-offset-0",
          contract.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        )}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ongoing">Đang chạy</SelectItem>
          <SelectItem value="completed">Hoàn thành</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thu nhập</h1>
        <p className="text-gray-500 mt-1">Theo dõi và quản lý thu nhập của bạn.</p>
      </div>

      <Tabs defaultValue="income">
        <div className="flex justify-between items-center">
          <TabsList className="flex w-full max-w-md rounded-lg border border-orange-200 p-0 bg-white">
            <TabsTrigger value="income" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md"><Wallet className="h-4 w-4" /><span>Thu nhập</span></TabsTrigger>
            <TabsTrigger value="contracts" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md"><Handshake className="h-4 w-4" /><span>Hợp đồng</span></TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-lg font-semibold w-32 text-center capitalize">{format(selectedDate, 'MMMM yyyy', { locale: vi })}</span>
            <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <TabsContent value="income" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportWidget icon={<Wallet className="h-5 w-5" />} title="Tổng thu nhập" value={formatCurrency(monthlyStats.totalIncome)} />
            <ReportWidget icon={<Landmark className="h-5 w-5" />} title="Lương cứng" value={formatCurrency(monthlyStats.fixedSalary)} />
            <ReportWidget icon={<Percent className="h-5 w-5" />} title="Hoa hồng" value={formatCurrency(monthlyStats.totalCommission)} />
            <ReportWidget icon={<FileText className="h-5 w-5" />} title="Hợp đồng" value={monthlyStats.contractCount.toString()} />
          </div>
          <Card>
            <CardHeader><CardTitle>Danh sách hợp đồng trong tháng</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên dự án</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Đã thanh toán</TableHead>
                    <TableHead>Còn nợ</TableHead>
                    <TableHead>Tiến độ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAll ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Đang tải...</TableCell></TableRow>
                  ) : monthlyContracts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Không có hợp đồng nào trong tháng này.</TableCell></TableRow>
                  ) : (
                    monthlyContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.project_name}</TableCell>
                        <TableCell>{formatCurrency(contract.contract_value)}</TableCell>
                        <TableCell>{formatCurrency(contract.paid_amount)}</TableCell>
                        <TableCell>{formatCurrency(contract.contract_value - contract.paid_amount)}</TableCell>
                        <TableCell>
                          <Badge variant={contract.status === 'completed' ? 'default' : 'secondary'} className={cn(contract.status === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-100 text-yellow-800')}>
                            {contract.status === 'completed' ? 'Hoàn thành' : 'Đang chạy'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contracts" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportWidget icon={<Handshake className="h-5 w-5" />} title="Tổng Hợp đồng" value={allContractsStats.total.toString()} />
            <ReportWidget icon={<Loader className="h-5 w-5" />} title="Đang chạy" value={allContractsStats.ongoing.toString()} />
            <ReportWidget icon={<CheckCircle className="h-5 w-5" />} title="Hoàn thành" value={allContractsStats.completed.toString()} />
            <ReportWidget icon={<CalendarPlus className="h-5 w-5" />} title="HĐ trong tháng" value={allContractsStats.thisMonth.toString()} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Quản lý Hợp đồng</CardTitle><CardDescription>Thêm mới, chỉnh sửa và theo dõi tất cả hợp đồng của bạn.</CardDescription></div>
              <div className="flex items-center space-x-2">
                <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Tìm theo tên dự án..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />Tạo hợp đồng</Button>
              </div>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Tên dự án</TableHead><TableHead>Giá trị</TableHead><TableHead>Đã thanh toán</TableHead><TableHead>Còn nợ</TableHead><TableHead>Tiến độ</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader><TableBody>{loadingAll ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Đang tải...</TableCell></TableRow> : filteredContracts.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Không có hợp đồng nào.</TableCell></TableRow> : (filteredContracts.map((contract) => (<TableRow key={contract.id}><TableCell className="font-medium">{contract.project_name}</TableCell><TableCell>{formatCurrency(contract.contract_value)}</TableCell><TableCell><EditableCurrencyCell contract={contract} onUpdate={handleFieldUpdate} /></TableCell><TableCell>{formatCurrency(contract.contract_value - contract.paid_amount)}</TableCell><TableCell><EditableStatusCell contract={contract} onUpdate={handleFieldUpdate} /></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEditClick(contract)}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(contract)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)))}</TableBody></Table></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingContract ? 'Sửa hợp đồng' : 'Tạo hợp đồng mới'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2"><Label htmlFor="project-name">Tên dự án</Label><Input id="project-name" value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
            <div className="space-y-2 col-span-2"><Label htmlFor="contract-link">Link hợp đồng</Label><Input id="contract-link" value={contractLink} onChange={e => setContractLink(e.target.value)} placeholder="https://..." /></div>
            <div className="space-y-2"><Label htmlFor="contract-value">Giá trị hợp đồng (VND)</Label><Input id="contract-value" type="text" value={formatNumberWithDots(contractValue)} onChange={e => setContractValue(parseFormattedNumber(e.target.value))} /></div>
            <div className="space-y-2"><Label>Trạng thái</Label><Select value={status} onValueChange={v => setStatus(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ongoing">Đang chạy</SelectItem><SelectItem value="completed">Hoàn thành</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Ngày bắt đầu</Label><DatePicker date={startDate} setDate={setStartDate} /></div>
            <div className="space-y-2"><Label>Ngày kết thúc (tùy chọn)</Label><DatePicker date={endDate} setDate={setEndDate} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveContract} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa hợp đồng "{contractToDelete?.project_name}" không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

export default Income;