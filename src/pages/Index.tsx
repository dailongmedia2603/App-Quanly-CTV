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
import { PlusCircle } from "lucide-react";
import CampaignToolbar, { CampaignFilters } from "@/components/CampaignToolbar";
import ScanStatusPopup from "@/components/ScanStatusPopup";
import { useAuth } from "@/contexts/AuthContext";
import { ScanHistoryDialog, ScanHistoryLog } from "@/components/ScanHistoryDialog";
import ListGroupTab from "@/components/campaign-scan/ListGroupTab";

export interface Campaign {
  id: string;
  name: string;
  type: string;
  audience_type: string;
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
  const [audienceType, setAudienceType] = useState("collaborator");
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
  const [updatedAudienceType, setUpdatedAudienceType] = useState("collaborator");
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
    setCampaignName(""); setAudienceType("collaborator"); setSelectedGroups([]); setEndDate(undefined); setScanFrequency(1); setScanUnit("day"); setScanStartDate(undefined); setKeywords(""); setUseAiFilter(false); setAiPrompt("");
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
      audience_type: audienceType,
      sources: selectedGroups,
      end_date: endDate?.toISOString() || null,
      scan_frequency: scanFrequency,
      scan_unit: scanUnit,
      next_scan_at: (scanStartDate || new Date()).toISOString(),
      scan_start_date: scanStartDate?.toISOString() || null,
      keywords: keywords,
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
    setEditingCampaign(campaign); setUpdatedCampaignName(campaign.name); setUpdatedAudienceType(campaign.audience_type); setUpdatedSelectedSources(campaign.sources); setUpdatedEndDate(campaign.end_date ? new Date(campaign.end_date) : undefined); setUpdatedScanFrequency(campaign.scan_frequency); setUpdatedScanUnit(campaign.scan_unit); setUpdatedScanStartDate(campaign.scan_start_date ? new Date(campaign.scan_start_date) : undefined); setUpdatedKeywords(campaign.keywords || ""); setUpdatedUseAiFilter(campaign.ai_filter_enabled || false); setUpdatedAiPrompt(campaign.ai_prompt || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    if (!updatedCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
    if (updatedSelectedSources.length === 0) return showError("Vui lòng chọn ít nhất một nguồn.");
    setIsUpdating(true);
    const toastId = showLoading("Đang cập nhật chiến dịch...");
    let payload: any = { name: updatedCampaignName, audience_type: updatedAudienceType, sources: updatedSelectedSources, end_date: updatedEndDate?.toISOString() || null, scan_frequency: updatedScanFrequency, scan_unit: updatedScanUnit, scan_start_date: updatedScanStartDate?.toISOString() || null, keywords: updatedKeywords, ai_filter_enabled: updatedUseAiFilter, ai_prompt: updatedUseAiFilter ? updatedAiPrompt : null };
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
          <Accordion type="single" collapsible className="w-full"><AccordionItem value="item-1" className="border rounded-lg overflow-hidden"><AccordionTrigger className="p-4 bg-gradient-to-r from-brand-orange-light to-white hover:no-underline"><div className="flex items-center space-x-3"><PlusCircle className="h-6 w-6 text-brand-orange" /><h3 className="text-lg font-semibold text-gray-800">TẠO CHIẾN DỊCH MỚI</h3></div></AccordionTrigger><AccordionContent><div className="p-6 bg-white"><div className="grid grid-cols-1 lg:grid-cols-4 gap-4"><div className="lg:col-span-2 space-y-2"><Label>Tên chiến dịch</Label><Input placeholder="VD: Quét group đối thủ" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} /></div><div className="space-y-2"><Label>Loại chiến dịch</Label><Select value={audienceType} onValueChange={setAudienceType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="collaborator">Cộng tác viên</SelectItem><SelectItem value="internal">Nội bộ</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={scanFrequency} onChange={(e) => setScanFrequency(parseInt(e.target.value, 10))} className="w-20" /><Select value={scanUnit} onValueChange={setScanUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div><div className="lg:col-span-4 space-y-2"><div className="flex items-center space-x-2"><Label>Chọn Group</Label>{selectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{selectedGroups.length}</span>)}</div><MultiSelectCombobox options={facebookGroupsOptions} selected={selectedGroups} onChange={setSelectedGroups} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." /></div><div className="lg:col-span-2 space-y-2"><Label>Muốn quét bài từ ngày</Label><DateTimePicker date={scanStartDate} setDate={setScanStartDate} /></div><div className="lg:col-span-2 space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={endDate} setDate={setEndDate} /></div><div className="lg:col-span-2 space-y-2"><Label>Từ khoá cần lọc</Label><Textarea placeholder="Mỗi từ khoá một hàng..." value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-24" /></div><div className="lg:col-span-2 space-y-2"><div className="flex items-center justify-between h-[28px]"><Label>Lọc bằng AI</Label><div className="flex items-center space-x-2"><Checkbox id="ai-filter" checked={useAiFilter} onCheckedChange={(c) => setUseAiFilter(c as boolean)} /><Label htmlFor="ai-filter" className="text-sm font-normal cursor-pointer">Bật</Label></div></div><Textarea placeholder="Nhập yêu cầu lọc của bạn cho AI..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={!useAiFilter} className="h-24" /></div><div className="lg:col-span-4 flex justify-end"><Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleCreateCampaign} disabled={isCreating}>{isCreating ? "Đang tạo..." : "Tạo chiến dịch"}</Button></div></div></div></AccordionContent></AccordionItem></Accordion>
          <CampaignToolbar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} filters={filters} onFiltersChange={setFilters} onScanStatusClick={() => setIsScanStatusOpen(true)} onScanHistoryClick={handleOpenScanHistory} />
          <CampaignList campaigns={facebookCampaigns} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} onViewDetails={handleViewDetails} onManualScan={handleManualScan} scanningId={manuallyScanningId} />
        </TabsContent>
        <TabsContent value="list-group" className="pt-6"><ListGroupTab /></TabsContent>
      </Tabs>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Sửa chiến dịch</DialogTitle><DialogDescription>Cập nhật thông tin cho chiến dịch "{editingCampaign?.name}".</DialogDescription></DialogHeader><div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4"><div className="space-y-2"><Label>Tên chiến dịch</Label><Input value={updatedCampaignName} onChange={(e) => setUpdatedCampaignName(e.target.value)} /></div><div className="space-y-2"><Label>Loại chiến dịch</Label><Select value={updatedAudienceType} onValueChange={setUpdatedAudienceType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="collaborator">Cộng tác viên</SelectItem><SelectItem value="internal">Nội bộ</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Tần suất</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={updatedScanFrequency} onChange={(e) => setUpdatedScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={updatedScanUnit} onValueChange={setUpdatedScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div><div className="space-y-2 col-span-2"><div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{editSources.groups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{editSources.groups.length}</span>)}</div><MultiSelectCombobox options={facebookGroupsOptions} selected={editSources.groups} onChange={(newGroups) => setUpdatedSelectedSources(newGroups)} placeholder="Chọn group..." /></div><div className="space-y-2"><Label>Quét từ ngày</Label><DateTimePicker date={updatedScanStartDate} setDate={setUpdatedScanStartDate} /></div><div className="space-y-2"><Label>Kết thúc</Label><DateTimePicker date={updatedEndDate} setDate={setUpdatedEndDate} /></div><div className="space-y-2 col-span-2"><Label>Từ khoá</Label><Textarea value={updatedKeywords} onChange={(e) => setUpdatedKeywords(e.target.value)} /></div><div className="space-y-2 col-span-2"><div className="flex items-center justify-between h-[28px]"><Label>Lọc AI</Label><div className="flex items-center space-x-2"><Checkbox id="edit-ai-filter" checked={updatedUseAiFilter} onCheckedChange={(c) => setUpdatedUseAiFilter(c as boolean)} /><Label htmlFor="edit-ai-filter" className="text-sm font-normal cursor-pointer">Bật</Label></div></div><Textarea value={updatedAiPrompt} onChange={(e) => setUpdatedAiPrompt(e.target.value)} disabled={!updatedUseAiFilter} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateCampaign} disabled={isUpdating} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isUpdating ? "Đang lưu..." : "Lưu"}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Chiến dịch "{deletingCampaign?.name}" sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <CampaignDetailsDialog campaign={viewingCampaign} isOpen={!!viewingCampaign} onOpenChange={(isOpen) => !isOpen && setViewingCampaign(null)} />
      <ScanStatusPopup isOpen={isScanStatusOpen} onOpenChange={setIsScanStatusOpen} />
      <ScanHistoryDialog isOpen={isScanHistoryOpen} onOpenChange={setIsScanHistoryOpen} logs={scanHistoryLogs} loading={loadingScanHistory} />
    </div>
  );
};

export default Index;