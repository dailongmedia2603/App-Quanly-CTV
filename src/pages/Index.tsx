import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import CampaignList from "@/components/CampaignList";
import { CampaignDetailsDialog } from "@/components/CampaignDetailsDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Search, ChevronRight, Plus, Pencil, Trash2, Upload, FileText } from "lucide-react";
import CampaignToolbar, { CampaignFilters } from "@/components/CampaignToolbar";
import ScanStatusPopup from "@/components/ScanStatusPopup";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";
import { ScanHistoryDialog, ScanHistoryLog } from "@/components/ScanHistoryDialog";

export interface Campaign {
  id: string;
  name: string;
  type: string;
  sources: string[];
  end_date: string | null;
  scan_frequency: number;
  scan_unit: string;
  status: string;
  created_at: string;
  scan_start_date: string | null;
  keywords: string | null;
  ai_filter_enabled: boolean;
  ai_prompt: string | null;
  next_scan_at: string | null;
  website_scan_type: string | null;
}

interface FacebookGroup {
  id: string;
  group_name: string | null;
  group_id: string | null;
  created_at: string;
  origin: string | null;
}

const ListGroupTab = ({ groups, loading, refetch }: { groups: FacebookGroup[], loading: boolean, refetch: () => void }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGroupId, setNewGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FacebookGroup | null>(null);
  const [updatedGroupId, setUpdatedGroupId] = useState("");
  const [updatedGroupName, setUpdatedGroupName] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<FacebookGroup | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddGroup = async () => {
    if (!newGroupId || !newGroupName) return showError("Vui lòng nhập đầy đủ ID và Tên group.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang thêm group...");
    const { error } = await supabase.from("list_nguon_facebook").insert([{ group_id: newGroupId, group_name: newGroupName, origin: "Manual" }]);
    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess("Thêm group thành công!");
      setIsAddDialogOpen(false);
      setNewGroupId("");
      setNewGroupName("");
      refetch();
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (group: FacebookGroup) => {
    setEditingGroup(group);
    setUpdatedGroupId(group.group_id || "");
    setUpdatedGroupName(group.group_name || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !updatedGroupId) return showError("Thông tin không hợp lệ.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang cập nhật group...");
    const { error } = await supabase.from("list_nguon_facebook").update({ group_id: updatedGroupId, group_name: updatedGroupName }).eq("id", editingGroup.id);
    dismissToast(toastId);
    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật group thành công!");
      setIsEditDialogOpen(false);
      setEditingGroup(null);
      refetch();
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (group: FacebookGroup) => {
    setGroupToDelete(group);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsSubmitting(true);
    setIsDeleteAlertOpen(false);
    const toastId = showLoading("Đang xóa group...");
    
    const { error } = await supabase.from("list_nguon_facebook").delete().eq("id", groupToDelete.id);
    
    dismissToast(toastId);

    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa group thành công!");
      refetch();
    }
    setGroupToDelete(null);
    setIsSubmitting(false);
  };

  const handleDownloadTemplate = () => {
    const sampleData = [{ group_id: '123456789012345', group_name: 'Tên group mẫu' }];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "mau_import_group.xlsx");
  };

  const handleImport = () => {
    if (!importFile) return showError("Vui lòng chọn một file để import.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang xử lý file...");
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as { group_id: string; group_name: string }[];
        if (json.length === 0) throw new Error("File không có dữ liệu.");
        const newGroups = json.map(row => {
          if (!row.group_id || !row.group_name) throw new Error("File phải có 2 cột 'group_id' và 'group_name'.");
          return { group_id: String(row.group_id), group_name: String(row.group_name), origin: 'Import' };
        });
        dismissToast(toastId);
        const insertToastId = showLoading(`Đang import ${newGroups.length} group...`);
        const { error } = await supabase.from('list_nguon_facebook').insert(newGroups);
        dismissToast(insertToastId);
        if (error) throw error;
        showSuccess(`Import thành công ${newGroups.length} group!`);
        setIsImportDialogOpen(false);
        setImportFile(null);
        refetch();
      } catch (error: any) {
        dismissToast(toastId);
        showError(`Lỗi xử lý file: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsArrayBuffer(importFile);
  };

  const filteredGroups = groups.filter((group) => group.group_id?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Tìm kiếm bằng Group ID" className="pl-10 border-orange-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}><DialogTrigger asChild><Button variant="outline" className="border-orange-200"><Upload className="h-4 w-4 mr-2" />Import</Button></DialogTrigger><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Import Group từ file Excel</DialogTitle><DialogDescription>File phải có 2 cột: 'group_id' và 'group_name'.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Chọn file</Label><Input id="import-file" type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} /><Button variant="link" onClick={handleDownloadTemplate} className="text-brand-orange justify-start p-0 h-auto"><FileText className="h-4 w-4 mr-2" />Tải file mẫu</Button></div></div><DialogFooter><Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Hủy</Button><Button onClick={handleImport} disabled={isSubmitting || !importFile} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang import..." : "Import"}</Button></DialogFooter></DialogContent></Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="h-4 w-4 mr-2" />Thêm Group</Button></DialogTrigger><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Thêm nguồn Group Facebook mới</DialogTitle><DialogDescription>Nhập ID và tên của group Facebook bạn muốn theo dõi.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label htmlFor="new-group-id">Group ID</Label><Input id="new-group-id" value={newGroupId} onChange={(e) => setNewGroupId(e.target.value)} /></div><div className="grid gap-2"><Label htmlFor="new-group-name">Tên Group</Label><Input id="new-group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button><Button onClick={handleAddGroup} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang thêm..." : "Thêm"}</Button></DialogFooter></DialogContent></Dialog>
        </div>
      </div>
      <div className="border border-orange-200 rounded-lg bg-white"><Table><TableHeader><TableRow className="bg-gray-50 hover:bg-gray-50"><TableHead className="w-[40px]"></TableHead><TableHead>Group ID</TableHead><TableHead>Tên Group</TableHead><TableHead>Ngày thêm</TableHead><TableHead>Nguồn</TableHead><TableHead className="text-right w-[120px]">Hành động</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Đang tải dữ liệu...</TableCell></TableRow> : filteredGroups.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">Không tìm thấy group nào.</TableCell></TableRow> : (filteredGroups.map((group) => (<TableRow key={group.id}><TableCell className="text-center"><ChevronRight className="h-4 w-4 text-gray-400" /></TableCell><TableCell className="font-mono text-gray-600">{group.group_id || "N/A"}</TableCell><TableCell>{group.group_name || "N/A"}</TableCell><TableCell>{format(new Date(group.created_at), 'dd/MM/yy HH:mm')}</TableCell><TableCell>{group.origin}</TableCell><TableCell className="text-right space-x-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(group)}><Pencil className="h-4 w-4 text-blue-500" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(group)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell></TableRow>)))}</TableBody></Table></div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Sửa thông tin Group</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label htmlFor="edit-group-id">Group ID</Label><Input id="edit-group-id" value={updatedGroupId} onChange={(e) => setUpdatedGroupId(e.target.value)} /></div><div className="grid gap-2"><Label htmlFor="edit-group-name">Tên Group</Label><Input id="edit-group-name" value={updatedGroupName} onChange={(e) => setUpdatedGroupName(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateGroup} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? "Đang lưu..." : "Lưu"}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn group khỏi danh sách của bạn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDeleteGroup} className="bg-red-600 hover:bg-red-700">{isSubmitting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

const Index = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [facebookGroupsData, setFacebookGroupsData] = useState<FacebookGroup[]>([]);
  const [loadingFacebookGroups, setLoadingFacebookGroups] = useState(true);
  const [manuallyScanningId, setManuallyScanningId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<CampaignFilters>({ status: 'all' });
  const [isScanStatusOpen, setIsScanStatusOpen] = useState(false);
  const [isScanHistoryOpen, setIsScanHistoryOpen] = useState(false);
  const [scanHistoryLogs, setScanHistoryLogs] = useState<ScanHistoryLog[]>([]);
  const [loadingScanHistory, setLoadingScanHistory] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date>();
  const [scanFrequency, setScanFrequency] = useState<number>(1);
  const [scanUnit, setScanUnit] = useState("day");
  const [isCreating, setIsCreating] = useState(false);
  const [scanStartDate, setScanStartDate] = useState<Date>();
  const [keywords, setKeywords] = useState("");
  const [useAiFilter, setUseAiFilter] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [updatedCampaignName, setUpdatedCampaignName] = useState("");
  const [updatedSelectedSources, setUpdatedSelectedSources] = useState<string[]>([]);
  const [updatedEndDate, setUpdatedEndDate] = useState<Date | undefined>();
  const [updatedScanFrequency, setUpdatedScanFrequency] = useState(1);
  const [updatedScanUnit, setUpdatedScanUnit] = useState("day");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedScanStartDate, setUpdatedScanStartDate] = useState<Date | undefined>();
  const [updatedKeywords, setUpdatedKeywords] = useState("");
  const [updatedUseAiFilter, setUpdatedUseAiFilter] = useState(false);
  const [updatedAiPrompt, setUpdatedAiPrompt] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  const facebookGroupsOptions = useMemo<SelectOption[]>(() => {
    return facebookGroupsData
      .filter(g => g.group_id && g.group_name)
      .map(g => ({ value: g.group_id!, label: g.group_name! }));
  }, [facebookGroupsData]);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    const { data, error } = await supabase.from('danh_sach_chien_dich').select('*').order('created_at', { ascending: false });
    if (error) showError("Không thể tải danh sách chiến dịch.");
    else setCampaigns(data as Campaign[]);
    setLoadingCampaigns(false);
  };

  const fetchFacebookGroups = async () => {
    setLoadingFacebookGroups(true);
    const { data, error } = await supabase.from("list_nguon_facebook").select("*").order("created_at", { ascending: false });
    if (error) showError("Không thể tải danh sách group.");
    else setFacebookGroupsData(data as FacebookGroup[]);
    setLoadingFacebookGroups(false);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchFacebookGroups();
  }, []);

  const resetFacebookForm = () => {
    setCampaignName(""); setSelectedGroups([]); setEndDate(undefined); setScanFrequency(1); setScanUnit("day"); setScanStartDate(undefined); setKeywords(""); setUseAiFilter(false); setAiPrompt("");
  };

  const handleCreateCampaign = async () => {
    if (!user) return showError("Bạn cần đăng nhập để tạo chiến dịch.");
    if (!campaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
    if (selectedGroups.length === 0) return showError("Vui lòng chọn ít nhất một group.");
    
    setIsCreating(true);
    const toastId = showLoading("Đang tạo chiến dịch...");
    
    const payload = {
      user_id: user.id,
      name: campaignName,
      type: 'Facebook',
      sources: selectedGroups,
      end_date: endDate?.toISOString() || null,
      scan_frequency: scanFrequency,
      scan_unit: scanUnit,
      next_scan_at: (scanStartDate || new Date()).toISOString(),
      scan_start_date: scanStartDate?.toISOString() || null,
      keywords,
      ai_filter_enabled: useAiFilter,
      ai_prompt: useAiFilter ? aiPrompt : null
    };

    const { data: newCampaign, error } = await supabase.from('danh_sach_chien_dich').insert(payload).select().single();
    
    dismissToast(toastId);
    if (error) {
      showError(`Tạo chiến dịch thất bại: ${error.message}`);
    } else {
      showSuccess("Chiến dịch đã được tạo thành công!");
      resetFacebookForm();
      fetchCampaigns();
      if (newCampaign) handleManualScan(newCampaign);
    }
    setIsCreating(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const toastId = showLoading("Đang cập nhật trạng thái...");
    const updatePayload: { status: string; next_scan_at?: string } = { status: newStatus };
    if (newStatus === 'active') updatePayload.next_scan_at = new Date().toISOString();
    const { error } = await supabase.from('danh_sach_chien_dich').update(updatePayload).eq('id', id);
    dismissToast(toastId);
    if (error) showError("Cập nhật thất bại.");
    else { showSuccess("Cập nhật trạng thái thành công!"); fetchCampaigns(); }
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign); setUpdatedCampaignName(campaign.name); setUpdatedSelectedSources(campaign.sources); setUpdatedEndDate(campaign.end_date ? new Date(campaign.end_date) : undefined); setUpdatedScanFrequency(campaign.scan_frequency); setUpdatedScanUnit(campaign.scan_unit); setUpdatedScanStartDate(campaign.scan_start_date ? new Date(campaign.scan_start_date) : undefined); setUpdatedKeywords(campaign.keywords || ""); setUpdatedUseAiFilter(campaign.ai_filter_enabled || false); setUpdatedAiPrompt(campaign.ai_prompt || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    if (!updatedCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
    if (updatedSelectedSources.length === 0) return showError("Vui lòng chọn ít nhất một nguồn.");
    setIsUpdating(true);
    const toastId = showLoading("Đang cập nhật chiến dịch...");
    let payload: any = { name: updatedCampaignName, sources: updatedSelectedSources, end_date: updatedEndDate?.toISOString() || null, scan_frequency: updatedScanFrequency, scan_unit: updatedScanUnit, scan_start_date: updatedScanStartDate?.toISOString() || null, keywords: updatedKeywords, ai_filter_enabled: updatedUseAiFilter, ai_prompt: updatedUseAiFilter ? updatedAiPrompt : null };
    if (editingCampaign.scan_frequency !== updatedScanFrequency || editingCampaign.scan_unit !== updatedScanUnit) {
      const calculateNextScan = (baseTime: Date, frequency: number, unit: string): Date => {
        const nextScan = new Date(baseTime.getTime());
        if (unit === 'minute') nextScan.setMinutes(nextScan.getMinutes() + frequency);
        else if (unit === 'hour') nextScan.setHours(nextScan.getHours() + frequency);
        else if (unit === 'day') nextScan.setDate(nextScan.getDate() + frequency);
        return nextScan;
      };
      payload.next_scan_at = calculateNextScan(new Date(), updatedScanFrequency, updatedScanUnit).toISOString();
    }
    const { error } = await supabase.from('danh_sach_chien_dich').update(payload).eq('id', editingCampaign.id);
    dismissToast(toastId);
    setIsUpdating(false);
    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật chiến dịch thành công!");
      setIsEditDialogOpen(false);
      setEditingCampaign(null);
      fetchCampaigns();
    }
  };

  const handleDeleteClick = (campaign: Campaign) => { setDeletingCampaign(campaign); setIsDeleteDialogOpen(true); };
  const handleConfirmDelete = async () => {
    if (!deletingCampaign) return;
    setIsDeleting(true);
    setIsDeleteDialogOpen(false);
    const toastId = showLoading("Đang xóa chiến dịch...");
    
    const { error } = await supabase.from('danh_sach_chien_dich').delete().eq('id', deletingCampaign.id);
    
    dismissToast(toastId);

    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa chiến dịch thành công!");
      fetchCampaigns();
    }
    setDeletingCampaign(null);
    setIsDeleting(false);
  };

  const handleViewDetails = (campaign: Campaign) => setViewingCampaign(campaign);
  const handleManualScan = async (campaign: Campaign) => {
    setManuallyScanningId(campaign.id);
    const { error } = await supabase.functions.invoke('trigger-manual-scan', { body: { campaign_id: campaign.id } });
    if (error) showError(`Không thể bắt đầu quét: ${error.message}`);
    else showSuccess("Đã bắt đầu quét. Hãy xem tiến độ ở nút 'Trạng thái quét' nhé.");
    setTimeout(() => setManuallyScanningId(null), 5000);
  };

  const handleOpenScanHistory = async () => {
    setIsScanHistoryOpen(true);
    setLoadingScanHistory(true);
    const { data, error } = await supabase.functions.invoke('get-scan-logs', {
      body: {} // No campaign_id to get all
    });
    if (error) {
      showError(`Không thể tải lịch sử quét: ${error.message}`);
      setScanHistoryLogs([]);
    } else {
      setScanHistoryLogs(data as ScanHistoryLog[]);
    }
    setLoadingScanHistory(false);
  };

  const filteredCampaigns = useMemo(() => campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filters.status === 'all' || c.status === filters.status)), [campaigns, searchTerm, filters]);
  const facebookCampaigns = filteredCampaigns.filter(c => c.type === 'Facebook');
  const editSources = useMemo(() => {
    if (!editingCampaign) return { groups: [] };
    const allGroupIds = facebookGroupsOptions.map(g => g.value);
    return {
      groups: editingCampaign.sources.filter(s => allGroupIds.includes(s)),
    };
  }, [editingCampaign, facebookGroupsOptions]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Chiến dịch</h1><p className="text-gray-500 mt-1">Tạo và quản lý các chiến dịch của bạn tại đây.</p></div>
      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="inline-flex items-center justify-center rounded-lg border border-orange-200 p-1 bg-white">
          <TabsTrigger value="facebook" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Tạo chiến dịch</TabsTrigger>
          <TabsTrigger value="list-group" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">List Group</TabsTrigger>
        </TabsList>
        <TabsContent value="facebook" className="pt-6">
          <Accordion type="single" collapsible className="w-full"><AccordionItem value="item-1" className="border rounded-lg overflow-hidden"><AccordionTrigger className="p-4 bg-gradient-to-r from-brand-orange-light to-white hover:no-underline"><div className="flex items-center space-x-3"><PlusCircle className="h-6 w-6 text-brand-orange" /><h3 className="text-lg font-semibold text-gray-800">TẠO CHIẾN DỊCH MỚI</h3></div></AccordionTrigger><AccordionContent><div className="p-6 bg-white"><div className="grid grid-cols-1 lg:grid-cols-4 gap-4"><div className="lg:col-span-2 space-y-2"><Label>Tên chiến dịch</Label><Input placeholder="VD: Quét group đối thủ" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} /></div><div className="space-y-2"><Label>Loại chiến dịch</Label><Input value="Facebook" disabled /></div><div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={scanFrequency} onChange={(e) => setScanFrequency(parseInt(e.target.value, 10))} className="w-20" /><Select value={scanUnit} onValueChange={setScanUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div><div className="lg:col-span-4 space-y-2"><div className="flex items-center space-x-2"><Label>Chọn Group</Label>{selectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{selectedGroups.length}</span>)}</div><MultiSelectCombobox options={facebookGroupsOptions} selected={selectedGroups} onChange={setSelectedGroups} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." /></div><div className="lg:col-span-2 space-y-2"><Label>Muốn quét bài từ ngày</Label><DateTimePicker date={scanStartDate} setDate={setScanStartDate} /></div><div className="lg:col-span-2 space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={endDate} setDate={setEndDate} /></div><div className="lg:col-span-2 space-y-2"><Label>Từ khoá cần lọc</Label><Textarea placeholder="Mỗi từ khoá một hàng..." value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-24" /></div><div className="lg:col-span-2 space-y-2"><div className="flex items-center justify-between h-[28px]"><Label>Lọc bằng AI</Label><div className="flex items-center space-x-2"><Checkbox id="ai-filter" checked={useAiFilter} onCheckedChange={(c) => setUseAiFilter(c as boolean)} /><Label htmlFor="ai-filter" className="text-sm font-normal cursor-pointer">Bật</Label></div></div><Textarea placeholder="Nhập yêu cầu lọc của bạn cho AI..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={!useAiFilter} className="h-24" /></div><div className="lg:col-span-4 flex justify-end"><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleCreateCampaign} disabled={isCreating}>{isCreating ? "Đang tạo..." : "Tạo chiến dịch"}</Button></div></div></div></AccordionContent></AccordionItem></Accordion>
          <CampaignToolbar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} filters={filters} onFiltersChange={setFilters} onScanStatusClick={() => setIsScanStatusOpen(true)} onScanHistoryClick={handleOpenScanHistory} />
          <CampaignList campaigns={facebookCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} onViewDetails={handleViewDetails} onManualScan={handleManualScan} scanningId={manuallyScanningId} />
        </TabsContent>
        <TabsContent value="list-group" className="pt-6"><ListGroupTab groups={facebookGroupsData} loading={loadingFacebookGroups} refetch={fetchFacebookGroups} /></TabsContent>
      </Tabs>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Sửa chiến dịch</DialogTitle><DialogDescription>Cập nhật thông tin cho chiến dịch "{editingCampaign?.name}".</DialogDescription></DialogHeader><div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4"><div className="space-y-2"><Label>Tên chiến dịch</Label><Input value={updatedCampaignName} onChange={(e) => setUpdatedCampaignName(e.target.value)} /></div><div className="space-y-2"><Label>Tần suất</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={updatedScanFrequency} onChange={(e) => setUpdatedScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={updatedScanUnit} onValueChange={setUpdatedScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div><div className="space-y-2 col-span-2"><div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{editSources.groups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{editSources.groups.length}</span>)}</div><MultiSelectCombobox options={facebookGroupsOptions} selected={editSources.groups} onChange={(newGroups) => setUpdatedSelectedSources(newGroups)} placeholder="Chọn group..." /></div><div className="space-y-2"><Label>Quét từ ngày</Label><DateTimePicker date={updatedScanStartDate} setDate={setUpdatedScanStartDate} /></div><div className="space-y-2"><Label>Kết thúc</Label><DateTimePicker date={updatedEndDate} setDate={setUpdatedEndDate} /></div><div className="space-y-2 col-span-2"><Label>Từ khoá</Label><Textarea value={updatedKeywords} onChange={(e) => setUpdatedKeywords(e.target.value)} /></div><div className="space-y-2 col-span-2"><div className="flex items-center justify-between h-[28px]"><Label>Lọc AI</Label><div className="flex items-center space-x-2"><Checkbox id="edit-ai-filter" checked={updatedUseAiFilter} onCheckedChange={(c) => setUpdatedUseAiFilter(c as boolean)} /><Label htmlFor="edit-ai-filter" className="text-sm font-normal cursor-pointer">Bật</Label></div></div><Textarea value={updatedAiPrompt} onChange={(e) => setUpdatedAiPrompt(e.target.value)} disabled={!updatedUseAiFilter} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateCampaign} disabled={isUpdating} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isUpdating ? "Đang lưu..." : "Lưu"}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Chiến dịch "{deletingCampaign?.name}" sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <CampaignDetailsDialog campaign={viewingCampaign} isOpen={!!viewingCampaign} onOpenChange={(isOpen) => !isOpen && setViewingCampaign(null)} />
      <ScanStatusPopup isOpen={isScanStatusOpen} onOpenChange={setIsScanStatusOpen} />
      <ScanHistoryDialog isOpen={isScanHistoryOpen} onOpenChange={setIsScanHistoryOpen} logs={scanHistoryLogs} loading={loadingScanHistory} />
    </div>
  );
};

export default Index;