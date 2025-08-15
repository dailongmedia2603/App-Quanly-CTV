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
import { Wallet, Landmark, Percent, FileText, Handshake, ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Pencil, Trash2, Loader, CheckCircle, CalendarPlus, Link as LinkIcon, Users as UsersIcon, History } from 'lucide-react';
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
import { User } from '@supabase/supabase-js';
import { SingleSelectCombobox } from '@/components/ui/single-select-combobox';
import { PaymentDetailsDialog } from '@/components/PaymentDetailsDialog';

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
  contract_link: string | null;
  user_id: string;
  collaborator_email?: string;
  collaborator_name?: string;
  total_paid: number;
}

interface Collaborator extends User {
    first_name?: string | null;
    last_name?: string | null;
}

interface IncomeStats {
    fixed_salary: number;
    new_contract_commission: number;
    old_contract_commission: number;
    total_income: number;
    contract_count: number;
    actual_received: number;
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

const EditableStatusCell = ({ contract, onUpdate, canEdit }: { contract: Contract; onUpdate: (id: string, updates: Partial<Contract>) => void; canEdit: boolean }) => {
  const handleStatusChange = (newStatus: 'ongoing' | 'completed') => {
    if (newStatus !== contract.status) {
      onUpdate(contract.id, { status: newStatus });
    }
  };

  return (
    <Select value={contract.status} onValueChange={handleStatusChange} disabled={!canEdit}>
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

const Income = () => {
  const { user, hasPermission, roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [allUsers, setAllUsers] = useState<Collaborator[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('all');
  const [incomeStats, setIncomeStats] = useState<IncomeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Dialog states
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedContractForPayments, setSelectedContractForPayments] = useState<string | null>(null);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [contractValue, setContractValue] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0.05);
  const [status, setStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [commissionPaid, setCommissionPaid] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [contractLink, setContractLink] = useState('');
  const [collaboratorId, setCollaboratorId] = useState<string | undefined>();

  const canCreate = hasPermission('income', 'create');
  const canUpdate = hasPermission('income', 'update');
  const canDelete = hasPermission('income', 'delete');

  useEffect(() => {
    if (contractValue > 40000000) setCommissionRate(0.10);
    else if (contractValue >= 20000000) setCommissionRate(0.07);
    else setCommissionRate(0.05);
  }, [contractValue]);

  const fetchAllContractsAndUsers = async () => {
    if (!user) return;
    setLoadingAll(true);

    let users: Collaborator[] = [];
    if (isSuperAdmin) {
        const { data, error: usersError } = await supabase.functions.invoke("admin-get-users-with-roles");
        if (usersError) showError("Không thể tải danh sách cộng tác viên.");
        else {
            users = (data.users || []) as Collaborator[];
            setAllUsers(users);
        }
    }

    const { data, error } = await supabase.from('contracts').select('*, payments:contract_payments(amount)');
    
    if (error) {
        showError("Không thể tải danh sách hợp đồng.");
        setAllContracts([]);
    } else {
        const contractsWithTotals = data.map(c => ({
            ...c,
            total_paid: c.payments.reduce((sum, p) => sum + p.amount, 0)
        }));

        if (isSuperAdmin) {
            const userMap = new Map(users.map(u => [u.id, u]));
            const contractsWithCollaborator = contractsWithTotals.map(c => {
                const collaborator = userMap.get(c.user_id);
                const fullName = collaborator ? `${collaborator.first_name || ''} ${collaborator.last_name || ''}`.trim() : '';
                return { ...c, collaborator_email: collaborator?.email || 'Không rõ', collaborator_name: fullName || collaborator?.email || 'Không rõ' };
            });
            setAllContracts(contractsWithCollaborator as Contract[]);
        } else {
            setAllContracts(contractsWithTotals as Contract[]);
        }
    }
    setLoadingAll(false);
  };

  useEffect(() => {
    fetchAllContractsAndUsers();
  }, [user, isSuperAdmin]);

  useEffect(() => {
    const fetchIncomeStats = async () => {
        setLoadingStats(true);
        const targetUserId = (isSuperAdmin && selectedCollaboratorId !== 'all') ? selectedCollaboratorId : (isSuperAdmin ? null : user!.id);
        const { data, error } = await supabase.rpc('get_income_stats_for_month', {
            target_month: format(selectedDate, 'yyyy-MM-dd'),
            target_user_id: targetUserId
        });
        if (error) {
            showError("Không thể tính toán thu nhập.");
            setIncomeStats(null);
        } else {
            setIncomeStats(data[0]);
        }
        setLoadingStats(false);
    };
    if (user) fetchIncomeStats();
  }, [selectedDate, user, isSuperAdmin, selectedCollaboratorId]);

  const collaboratorFilteredContracts = useMemo(() => {
    if (!isSuperAdmin || selectedCollaboratorId === 'all') return allContracts;
    return allContracts.filter(contract => contract.user_id === selectedCollaboratorId);
  }, [allContracts, selectedCollaboratorId, isSuperAdmin]);

  const monthlyContracts = useMemo(() => {
    if (!collaboratorFilteredContracts) return [];
    const from = startOfMonth(selectedDate);
    const to = endOfMonth(selectedDate);
    return collaboratorFilteredContracts.filter(contract => new Date(contract.start_date) >= from && new Date(contract.start_date) <= to);
  }, [collaboratorFilteredContracts, selectedDate]);

  const allContractsStats = useMemo(() => {
    const total = collaboratorFilteredContracts.length;
    const ongoing = collaboratorFilteredContracts.filter(c => c.status === 'ongoing').length;
    const completed = collaboratorFilteredContracts.filter(c => c.status === 'completed').length;
    const thisMonth = collaboratorFilteredContracts.filter(c => new Date(c.created_at) >= startOfMonth(new Date())).length;
    return { total, ongoing, completed, thisMonth };
  }, [collaboratorFilteredContracts]);

  const filteredContracts = useMemo(() => {
    return collaboratorFilteredContracts.filter(c => c.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [collaboratorFilteredContracts, searchTerm]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedDate(currentDate => direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const resetForm = () => {
    setProjectName(''); setContractValue(0); setStatus('ongoing');
    setCommissionPaid(false); setStartDate(new Date()); setEndDate(undefined);
    setContractLink(''); setCollaboratorId(isSuperAdmin ? undefined : user!.id);
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
    setCollaboratorId(contract.user_id);
    setIsContractDialogOpen(true);
  };

  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteAlertOpen(true);
  };

  const handleSaveContract = async () => {
    if (!user || !projectName || !startDate) return showError("Vui lòng điền đầy đủ thông tin bắt buộc.");
    const assignedUserId = isSuperAdmin ? collaboratorId : user!.id;
    if (!assignedUserId) return showError("Vui lòng chọn một cộng tác viên.");
    setIsSubmitting(true);
    const toastId = showLoading(editingContract ? "Đang cập nhật..." : "Đang tạo...");
    const payload = { user_id: assignedUserId, project_name: projectName, contract_value: contractValue, commission_rate: commissionRate, status, commission_paid: commissionPaid, start_date: startDate.toISOString(), end_date: endDate?.toISOString() || null, contract_link: contractLink };
    const query = editingContract ? supabase.from('contracts').update(payload).eq('id', editingContract.id) : supabase.from('contracts').insert(payload);
    const { error } = await query;
    dismissToast(toastId);
    if (error) showError(`Lưu thất bại: ${error.message}`);
    else { showSuccess("Lưu hợp đồng thành công!"); setIsContractDialogOpen(false); fetchAllContractsAndUsers(); }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('contracts').delete().eq('id', contractToDelete.id);
    dismissToast(toastId);
    if (error) showError(`Xóa thất bại: ${error.message}`);
    else { showSuccess("Xóa hợp đồng thành công!"); fetchAllContractsAndUsers(); }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handleFieldUpdate = async (contractId: string, updates: Partial<Contract>) => {
    const toastId = showLoading("Đang cập nhật...");
    const { error } = await supabase.from('contracts').update(updates).eq('id', contractId);
    dismissToast(toastId);
    if (error) showError(`Cập nhật thất bại: ${error.message}`);
    else { showSuccess("Cập nhật thành công!"); fetchAllContractsAndUsers(); }
  };

  const collaboratorOptions = allUsers.map(u => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    const displayLabel = fullName || u.email || u.id;
    const searchValue = `${displayLabel} ${u.email}`.toLowerCase();
    return { value: u.id, label: <div><div className="font-medium leading-snug">{displayLabel}</div>{fullName && <div className="text-xs text-gray-500 leading-snug">{u.email}</div>}</div>, searchValue: searchValue };
  });

  return (
    <>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Thu nhập</h1><p className="text-gray-500 mt-1">Theo dõi và quản lý thu nhập của bạn.</p></div>
        <Tabs defaultValue="income">
          <div className="flex justify-between items-center">
            <TabsList className="flex w-full max-w-md rounded-lg border border-orange-200 p-0 bg-white"><TabsTrigger value="income" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md"><Wallet className="h-4 w-4" /><span>Thu nhập</span></TabsTrigger><TabsTrigger value="contracts" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md"><Handshake className="h-4 w-4" /><span>Hợp đồng</span></TabsTrigger></TabsList>
            <div className="flex items-center space-x-4">
              {isSuperAdmin && (<div className="w-[220px]"><SingleSelectCombobox options={[{ value: 'all', label: 'Tất cả cộng tác viên', searchValue: 'tất cả cộng tác viên' }, ...collaboratorOptions]} selected={selectedCollaboratorId} onChange={(value) => setSelectedCollaboratorId(value || 'all')} placeholder="Lọc theo cộng tác viên" searchPlaceholder="Tìm cộng tác viên..." emptyPlaceholder="Không tìm thấy." /></div>)}
              <div className="flex items-center space-x-2"><Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}><ChevronLeft className="h-4 w-4" /></Button><span className="text-lg font-semibold w-32 text-center capitalize">{format(selectedDate, 'MMMM yyyy', { locale: vi })}</span><Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}><ChevronRight className="h-4 w-4" /></Button></div>
            </div>
          </div>
          <TabsContent value="income" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <ReportWidget icon={<Wallet className="h-5 w-5" />} title="Tổng thu nhập" value={formatCurrency(incomeStats?.total_income || 0)} />
              <ReportWidget icon={<Landmark className="h-5 w-5" />} title="Lương cứng" value={formatCurrency(incomeStats?.fixed_salary || 0)} />
              <ReportWidget icon={<Percent className="h-5 w-5" />} title="Hoa hồng (HĐ mới)" value={formatCurrency(incomeStats?.new_contract_commission || 0)} />
              <ReportWidget icon={<History className="h-5 w-5" />} title="Hoa hồng (HĐ cũ)" value={formatCurrency(incomeStats?.old_contract_commission || 0)} />
              <ReportWidget icon={<CheckCircle className="h-5 w-5" />} title="Thực nhận" value={formatCurrency(incomeStats?.actual_received || 0)} />
            </div>
            <Card><CardHeader><CardTitle>Danh sách hợp đồng trong tháng</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tên dự án</TableHead><TableHead>Link hợp đồng</TableHead><TableHead>Giá trị</TableHead><TableHead>Đã thanh toán</TableHead><TableHead>Còn nợ</TableHead><TableHead>Tiến độ</TableHead>{isSuperAdmin && <TableHead>Cộng tác viên</TableHead>}</TableRow></TableHeader><TableBody>{loadingAll ? <TableRow><TableCell colSpan={isSuperAdmin ? 7 : 6} className="h-24 text-center">Đang tải...</TableCell></TableRow> : monthlyContracts.length === 0 ? <TableRow><TableCell colSpan={isSuperAdmin ? 7 : 6} className="h-24 text-center">Không có hợp đồng nào trong tháng này.</TableCell></TableRow> : (monthlyContracts.map((contract) => (<TableRow key={contract.id}><TableCell className="font-medium">{contract.project_name}</TableCell><TableCell>{contract.contract_link ? (<Button variant="link" asChild className="p-0 h-auto text-brand-orange hover:text-brand-orange/80"><a href={contract.contract_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1"><LinkIcon className="h-4 w-4" /><span>Xem</span></a></Button>) : (<span className="text-gray-400">N/A</span>)}</TableCell><TableCell>{formatCurrency(contract.contract_value)}</TableCell><TableCell>{formatCurrency(contract.total_paid)}</TableCell><TableCell>{formatCurrency(contract.contract_value - contract.total_paid)}</TableCell><TableCell><Badge variant={contract.status === 'completed' ? 'default' : 'secondary'} className={cn(contract.status === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-100 text-yellow-800')}>{contract.status === 'completed' ? 'Hoàn thành' : 'Đang chạy'}</Badge></TableCell>{isSuperAdmin && <TableCell><div><div className="font-medium leading-snug">{contract.collaborator_name}</div>{contract.collaborator_name !== contract.collaborator_email && (<div className="text-xs text-gray-500 leading-snug">{contract.collaborator_email}</div>)}</div></TableCell></TableRow>)))}</TableBody></Table></CardContent></Card>
          </TabsContent>
          <TabsContent value="contracts" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><ReportWidget icon={<Handshake className="h-5 w-5" />} title="Tổng Hợp đồng" value={allContractsStats.total.toString()} /><ReportWidget icon={<Loader className="h-5 w-5" />} title="Đang chạy" value={allContractsStats.ongoing.toString()} /><ReportWidget icon={<CheckCircle className="h-5 w-5" />} title="Hoàn thành" value={allContractsStats.completed.toString()} /><ReportWidget icon={<CalendarPlus className="h-5 w-5" />} title="HĐ trong tháng" value={allContractsStats.thisMonth.toString()} /></div>
            <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Quản lý Hợp đồng</CardTitle><CardDescription>Thêm mới, chỉnh sửa và theo dõi tất cả hợp đồng của bạn.</CardDescription></div><div className="flex items-center space-x-2"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Tìm theo tên dự án..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>{canCreate && <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />Tạo hợp đồng</Button>}</div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tên dự án</TableHead><TableHead>Giá trị</TableHead><TableHead>Đã thanh toán</TableHead><TableHead>Còn nợ</TableHead><TableHead>Tiến độ</TableHead>{isSuperAdmin && <TableHead>Cộng tác viên</TableHead>}{(canUpdate || canDelete) && <TableHead className="text-right">Hành động</TableHead>}</TableRow></TableHeader><TableBody>{loadingAll ? <TableRow><TableCell colSpan={isSuperAdmin ? 7 : 6} className="h-24 text-center">Đang tải...</TableCell></TableRow> : filteredContracts.length === 0 ? <TableRow><TableCell colSpan={isSuperAdmin ? 7 : 6} className="h-24 text-center">Không có hợp đồng nào.</TableCell></TableRow> : (filteredContracts.map((contract) => (<TableRow key={contract.id}><TableCell className="font-medium">{contract.project_name}</TableCell><TableCell>{formatCurrency(contract.contract_value)}</TableCell><TableCell>{formatCurrency(contract.total_paid)}</TableCell><TableCell>{formatCurrency(contract.contract_value - contract.total_paid)}</TableCell><TableCell><EditableStatusCell contract={contract} onUpdate={handleFieldUpdate} canEdit={canUpdate} /></TableCell>{isSuperAdmin && <TableCell><div><div className="font-medium leading-snug">{contract.collaborator_name}</div>{contract.collaborator_name !== contract.collaborator_email && (<div className="text-xs text-gray-500 leading-snug">{contract.collaborator_email}</div>)}</div></TableCell>}{(canUpdate || canDelete) && <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedContractForPayments(contract.id); setIsPaymentDialogOpen(true); }}><Wallet className="mr-2 h-4 w-4" />Thanh toán</DropdownMenuItem>{canUpdate && <DropdownMenuItem onClick={() => handleEditClick(contract)}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>}{canDelete && <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(contract)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></TableCell>}</TableRow>)))}</TableBody></Table></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
      <PaymentDetailsDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} contractId={selectedContractForPayments} onPaymentsUpdate={fetchAllContractsAndUsers} />
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{editingContract ? 'Sửa hợp đồng' : 'Tạo hợp đồng mới'}</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-4 py-4"><div className="space-y-2 col-span-2"><Label htmlFor="project-name">Tên dự án</Label><Input id="project-name" value={projectName} onChange={e => setProjectName(e.target.value)} /></div>{isSuperAdmin && (<div className="space-y-2 col-span-2"><Label htmlFor="collaborator" className="flex items-center"><UsersIcon className="h-4 w-4 mr-2" />Cộng tác viên</Label><SingleSelectCombobox options={allUsers.map(u => ({ value: u.id, label: <div><div className="font-medium leading-snug">{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</div>{u.email && <div className="text-xs text-gray-500 leading-snug">{u.email}</div>}</div>, searchValue: `${u.first_name || ''} ${u.last_name || ''} ${u.email}`.trim() }))} selected={collaboratorId} onChange={setCollaboratorId} placeholder="Chọn cộng tác viên..." searchPlaceholder="Tìm kiếm..." emptyPlaceholder="Không tìm thấy." /></div>)}<div className="space-y-2 col-span-2"><Label htmlFor="contract-link">Link hợp đồng</Label><Input id="contract-link" value={contractLink} onChange={e => setContractLink(e.target.value)} placeholder="https://..." /></div><div className="space-y-2"><Label htmlFor="contract-value">Giá trị hợp đồng (VND)</Label><Input id="contract-value" type="text" value={formatNumberWithDots(contractValue)} onChange={e => setContractValue(parseFormattedNumber(e.target.value))} /></div><div className="space-y-2"><Label>Trạng thái</Label><Select value={status} onValueChange={v => setStatus(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ongoing">Đang chạy</SelectItem><SelectItem value="completed">Hoàn thành</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Ngày bắt đầu</Label><DatePicker date={startDate} setDate={setStartDate} /></div><div className="space-y-2"><Label>Ngày kết thúc (tùy chọn)</Label><DatePicker date={endDate} setDate={setEndDate} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsContractDialogOpen(false)}>Hủy</Button><Button onClick={handleSaveContract} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa hợp đồng "{contractToDelete?.project_name}" không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
};

export default Income;