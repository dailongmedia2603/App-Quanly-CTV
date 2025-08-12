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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle } from "lucide-react";
import CampaignToolbar, { CampaignFilters } from "@/components/CampaignToolbar";
import ScanStatusPopup from "@/components/ScanStatusPopup";

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

const Index = () => {
  // Common state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [facebookGroups, setFacebookGroups] = useState<SelectOption[]>([]);
  const [websiteSources, setWebsiteSources] = useState<SelectOption[]>([]);
  const [manuallyScanningId, setManuallyScanningId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<CampaignFilters>({ status: 'all' });
  const [isScanStatusOpen, setIsScanStatusOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("facebook");

  // Facebook form state
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

  // Website form state
  const [websiteCampaignName, setWebsiteCampaignName] = useState("");
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [websiteEndDate, setWebsiteEndDate] = useState<Date>();
  const [websiteScanFrequency, setWebsiteScanFrequency] = useState<number>(1);
  const [websiteScanUnit, setWebsiteScanUnit] = useState("day");
  const [isCreatingWebsite, setIsCreatingWebsite] = useState(false);
  const [websiteScanType, setWebsiteScanType] = useState("/scrape");

  // Combined form state
  const [combinedCampaignName, setCombinedCampaignName] = useState("");
  const [combinedSelectedGroups, setCombinedSelectedGroups] = useState<string[]>([]);
  const [combinedSelectedWebsites, setCombinedSelectedWebsites] = useState<string[]>([]);
  const [combinedEndDate, setCombinedEndDate] = useState<Date>();
  const [combinedScanFrequency, setCombinedScanFrequency] = useState<number>(1);
  const [combinedScanUnit, setCombinedScanUnit] = useState("day");
  const [isCreatingCombined, setIsCreatingCombined] = useState(false);
  const [combinedWebsiteScanType, setCombinedWebsiteScanType] = useState("/scrape");

  // Edit dialog state
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
  const [updatedWebsiteScanType, setUpdatedWebsiteScanType] = useState("/scrape");

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View details dialog state
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    const { data, error } = await supabase
      .from('danh_sach_chien_dich')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError("Không thể tải danh sách chiến dịch.");
    } else {
      setCampaigns(data as Campaign[]);
    }
    setLoadingCampaigns(false);
  };

  useEffect(() => {
    fetchCampaigns();

    const fetchGroups = async () => {
      const { data, error } = await supabase.from('list_nguon_facebook').select('group_id, group_name');
      if (error) {
        showError("Không thể tải danh sách group Facebook.");
      } else if (data) {
        setFacebookGroups(data.filter(g => g.group_id && g.group_name).map(g => ({ value: g.group_id!, label: g.group_name! })));
      }
    };

    const fetchWebsites = async () => {
      const { data, error } = await supabase.from('list_nguon_website').select('url');
      if (error) {
        showError("Không thể tải danh sách website.");
      } else if (data) {
        setWebsiteSources(data.filter(w => w.url).map(w => ({ value: w.url!, label: w.url! })));
      }
    };

    fetchGroups();
    fetchWebsites();
  }, []);

  const resetFacebookForm = () => {
    setCampaignName("");
    setSelectedGroups([]);
    setEndDate(undefined);
    setScanFrequency(1);
    setScanUnit("day");
    setScanStartDate(undefined);
    setKeywords("");
    setUseAiFilter(false);
    setAiPrompt("");
  };

  const resetWebsiteForm = () => {
    setWebsiteCampaignName("");
    setSelectedWebsites([]);
    setWebsiteEndDate(undefined);
    setWebsiteScanFrequency(1);
    setWebsiteScanUnit("day");
    setWebsiteScanType("/scrape");
  };

  const resetCombinedForm = () => {
    setCombinedCampaignName("");
    setCombinedSelectedGroups([]);
    setCombinedSelectedWebsites([]);
    setCombinedEndDate(undefined);
    setCombinedScanFrequency(1);
    setCombinedScanUnit("day");
    setCombinedWebsiteScanType("/scrape");
  };

  const handleCreateCampaign = async (type: 'Facebook' | 'Website' | 'Tổng hợp') => {
    let name, sources, localEndDate, localScanFrequency, localScanUnit, setIsCreatingState, resetForm;
    let payload: any = {};

    if (type === 'Facebook') {
      if (!campaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
      if (selectedGroups.length === 0) return showError("Vui lòng chọn ít nhất một group.");
      name = campaignName;
      sources = selectedGroups;
      localEndDate = endDate;
      localScanFrequency = scanFrequency;
      localScanUnit = scanUnit;
      setIsCreatingState = setIsCreating;
      resetForm = resetFacebookForm;
      payload = {
        scan_start_date: scanStartDate ? scanStartDate.toISOString() : null,
        keywords: keywords,
        ai_filter_enabled: useAiFilter,
        ai_prompt: useAiFilter ? aiPrompt : null,
      };
    } else if (type === 'Website') {
      if (!websiteCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
      if (selectedWebsites.length === 0) return showError("Vui lòng chọn ít nhất một website.");
      name = websiteCampaignName;
      sources = selectedWebsites;
      localEndDate = websiteEndDate;
      localScanFrequency = websiteScanFrequency;
      localScanUnit = websiteScanUnit;
      setIsCreatingState = setIsCreatingWebsite;
      resetForm = resetWebsiteForm;
      payload = {
        website_scan_type: websiteScanType,
      };
    } else { // Combined
      if (!combinedCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
      if (combinedSelectedGroups.length === 0 && combinedSelectedWebsites.length === 0) return showError("Vui lòng chọn ít nhất một nguồn (Group hoặc Website).");
      name = combinedCampaignName;
      sources = [...combinedSelectedGroups, ...combinedSelectedWebsites];
      localEndDate = combinedEndDate;
      localScanFrequency = combinedScanFrequency;
      localScanUnit = combinedScanUnit;
      setIsCreatingState = setIsCreatingCombined;
      resetForm = resetCombinedForm;
      payload = {
        website_scan_type: combinedWebsiteScanType,
      };
    }

    setIsCreatingState(true);
    const toastId = showLoading("Đang tạo chiến dịch...");
    
    const finalPayload = {
      name, type, sources,
      end_date: localEndDate ? localEndDate.toISOString() : null,
      scan_frequency: localScanFrequency, scan_unit: localScanUnit,
      next_scan_at: (type === 'Facebook' ? (scanStartDate || new Date()) : new Date()).toISOString(),
      ...payload
    };

    const { data: newCampaign, error } = await supabase.from('danh_sach_chien_dich').insert(finalPayload).select().single();
    
    dismissToast(toastId);
    if (error) {
      showError(`Tạo chiến dịch thất bại: ${error.message}`);
    } else {
      showSuccess("Chiến dịch đã được tạo thành công!");
      resetForm();
      fetchCampaigns();

      if (newCampaign) {
        handleManualScan(newCampaign);
      }
    }
    setIsCreatingState(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const toastId = showLoading("Đang cập nhật trạng thái...");
    
    const updatePayload: { status: string; next_scan_at?: string } = { status: newStatus };
    if (newStatus === 'active') {
        updatePayload.next_scan_at = new Date().toISOString();
    }

    const { error } = await supabase.from('danh_sach_chien_dich').update(updatePayload).eq('id', id);
    
    dismissToast(toastId);
    if (error) {
      showError("Cập nhật thất bại.");
    } else {
      showSuccess("Cập nhật trạng thái thành công!");
      fetchCampaigns();
    }
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setUpdatedCampaignName(campaign.name);
    setUpdatedSelectedSources(campaign.sources);
    setUpdatedEndDate(campaign.end_date ? new Date(campaign.end_date) : undefined);
    setUpdatedScanFrequency(campaign.scan_frequency);
    setUpdatedScanUnit(campaign.scan_unit);
    setUpdatedScanStartDate(campaign.scan_start_date ? new Date(campaign.scan_start_date) : undefined);
    setUpdatedKeywords(campaign.keywords || "");
    setUpdatedUseAiFilter(campaign.ai_filter_enabled || false);
    setUpdatedAiPrompt(campaign.ai_prompt || "");
    if (campaign.type === 'Website' || campaign.type === 'Tổng hợp') {
      setUpdatedWebsiteScanType(campaign.website_scan_type || '/scrape');
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    if (!updatedCampaignName.trim()) return showError("Vui lòng nhập tên chiến dịch.");
    if (updatedSelectedSources.length === 0) return showError("Vui lòng chọn ít nhất một nguồn.");
    
    setIsUpdating(true);
    const toastId = showLoading("Đang cập nhật chiến dịch...");
    
    let payload: any = {
      name: updatedCampaignName, 
      sources: updatedSelectedSources,
      end_date: updatedEndDate ? updatedEndDate.toISOString() : null,
      scan_frequency: updatedScanFrequency, 
      scan_unit: updatedScanUnit,
    };

    const frequencyChanged = editingCampaign.scan_frequency !== updatedScanFrequency;
    const unitChanged = editingCampaign.scan_unit !== updatedScanUnit;

    if (frequencyChanged || unitChanged) {
        const calculateNextScan = (baseTime: Date, frequency: number, unit: string): Date => {
            const nextScan = new Date(baseTime.getTime());
            switch (unit) {
                case 'minute':
                    nextScan.setMinutes(nextScan.getMinutes() + frequency);
                    break;
                case 'hour':
                    nextScan.setHours(nextScan.getHours() + frequency);
                    break;
                case 'day':
                    nextScan.setDate(nextScan.getDate() + frequency);
                    break;
                default:
                    nextScan.setHours(nextScan.getHours() + frequency);
                    break;
            }
            return nextScan;
        };
        const nextScanTime = calculateNextScan(new Date(), updatedScanFrequency, updatedScanUnit);
        payload.next_scan_at = nextScanTime.toISOString();
    }

    if (editingCampaign.type === 'Facebook') {
      payload = {
        ...payload,
        scan_start_date: updatedScanStartDate ? updatedScanStartDate.toISOString() : null,
        keywords: updatedKeywords,
        ai_filter_enabled: updatedUseAiFilter,
        ai_prompt: updatedUseAiFilter ? updatedAiPrompt : null,
      };
    }

    if (editingCampaign.type === 'Website' || editingCampaign.type === 'Tổng hợp') {
      payload.website_scan_type = updatedWebsiteScanType;
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

  const handleDeleteClick = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCampaign) return;
    setIsDeleting(true);
    const toastId = showLoading("Đang xóa chiến dịch...");
    const { error } = await supabase.from('danh_sach_chien_dich').delete().eq('id', deletingCampaign.id);
    dismissToast(toastId);
    setIsDeleting(false);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa chiến dịch thành công!");
      setIsDeleteDialogOpen(false);
      setDeletingCampaign(null);
      fetchCampaigns();
    }
  };

  const handleViewDetails = (campaign: Campaign) => {
    setViewingCampaign(campaign);
  };

  const handleManualScan = async (campaign: Campaign) => {
    setManuallyScanningId(campaign.id);
    
    const { error } = await supabase.functions.invoke('trigger-manual-scan', {
      body: { campaign_id: campaign.id },
    });

    if (error) {
      showError(`Không thể bắt đầu quét: ${error.message}`);
    } else {
      showSuccess("Đã bắt đầu quét. Hãy xem tiến độ ở nút 'Trạng thái quét' nhé.");
    }
    
    setTimeout(() => setManuallyScanningId(null), 5000);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || campaign.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, filters]);

  const facebookCampaigns = filteredCampaigns.filter(c => c.type === 'Facebook');
  const websiteCampaigns = filteredCampaigns.filter(c => c.type === 'Website');
  const combinedCampaigns = filteredCampaigns.filter(c => c.type === 'Tổng hợp');

  const getSourcesForEdit = (campaign: Campaign | null) => {
    if (!campaign) return { groups: [], websites: [] };
    const allGroupIds = facebookGroups.map(g => g.value);
    const allWebsiteUrls = websiteSources.map(w => w.value);
    
    const groups = campaign.sources.filter(s => allGroupIds.includes(s));
    const websites = campaign.sources.filter(s => allWebsiteUrls.includes(s));
    
    return { groups, websites };
  };

  const editSources = getSourcesForEdit(editingCampaign);

  const renderCampaignTab = (type: 'Facebook' | 'Website' | 'Tổng hợp', campaignsToShow: Campaign[], formContent: React.ReactNode) => (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="p-4 bg-gradient-to-r from-brand-orange-light to-white hover:no-underline">
            <div className="flex items-center space-x-3">
              <PlusCircle className="h-6 w-6 text-brand-orange" />
              <h3 className="text-lg font-semibold text-gray-800">TẠO CHIẾN DỊCH MỚI</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {formContent}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <CampaignToolbar 
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        onScanStatusClick={() => setIsScanStatusOpen(true)}
      />
      <CampaignList campaigns={campaignsToShow} loading={loadingCampaigns} onStatusChange={handleStatusChange} onEdit={handleEditClick} onDelete={handleDeleteClick} onViewDetails={handleViewDetails} onManualScan={handleManualScan} scanningId={manuallyScanningId} />
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chiến dịch</h1>
        <p className="text-gray-500 mt-1">Tạo và quản lý các chiến dịch của bạn tại đây.</p>
      </div>

      <Tabs defaultValue="facebook" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="inline-flex items-center justify-center rounded-lg border border-orange-200 p-1 bg-white">
          <TabsTrigger value="facebook" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Facebook</TabsTrigger>
          <TabsTrigger value="website" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Website</TabsTrigger>
          <TabsTrigger value="combined" className="px-4 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:text-gray-900 rounded-md">Tổng hợp</TabsTrigger>
        </TabsList>
        
        <TabsContent value="facebook" className="pt-6">
          {renderCampaignTab('Facebook', facebookCampaigns, (
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2 space-y-2">
                  <Label>Tên chiến dịch</Label>
                  <Input placeholder="VD: Quét group đối thủ" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loại chiến dịch</Label>
                  <Input value="Facebook" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Tần suất quét</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="number" min="1" value={scanFrequency} onChange={(e) => setScanFrequency(parseInt(e.target.value, 10))} className="w-20" />
                    <Select value={scanUnit} onValueChange={setScanUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Phút</SelectItem>
                        <SelectItem value="hour">Giờ</SelectItem>
                        <SelectItem value="day">Ngày</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="lg:col-span-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Chọn Group</Label>
                    {selectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{selectedGroups.length}</span>)}
                  </div>
                  <MultiSelectCombobox options={facebookGroups} selected={selectedGroups} onChange={setSelectedGroups} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label>Muốn quét bài từ ngày</Label>
                  <DateTimePicker date={scanStartDate} setDate={setScanStartDate} />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label>Thời gian kết thúc</Label>
                  <DateTimePicker date={endDate} setDate={setEndDate} />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label>Từ khoá cần lọc</Label>
                  <Textarea placeholder="Mỗi từ khoá một hàng..." value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-24" />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <div className="flex items-center justify-between h-[28px]">
                    <Label>Lọc bằng AI</Label>
                    <div className="flex items-center space-x-2"><Checkbox id="ai-filter" checked={useAiFilter} onCheckedChange={(checked) => setUseAiFilter(checked as boolean)} /><Label htmlFor="ai-filter" className="text-sm font-normal cursor-pointer">Bật</Label></div>
                  </div>
                  <Textarea placeholder="Nhập yêu cầu lọc của bạn cho AI..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={!useAiFilter} className="h-24" />
                </div>
                <div className="lg:col-span-4 flex justify-end">
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleCreateCampaign('Facebook')} disabled={isCreating}>
                    {isCreating ? "Đang tạo..." : "Tạo chiến dịch"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="website" className="pt-6">
          {renderCampaignTab('Website', websiteCampaigns, (
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2 space-y-2">
                  <Label>Tên chiến dịch</Label>
                  <Input placeholder="VD: Quét giá sản phẩm" value={websiteCampaignName} onChange={(e) => setWebsiteCampaignName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Loại chiến dịch</Label>
                  <Input value="Website" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Loại quét</Label>
                  <Select value={websiteScanType} onValueChange={setWebsiteScanType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/scrape">/scrape</SelectItem>
                      <SelectItem value="/crawl">/crawl</SelectItem>
                      <SelectItem value="/map">/map</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="lg:col-span-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Chọn Website</Label>
                    {selectedWebsites.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{selectedWebsites.length}</span>)}
                  </div>
                  <MultiSelectCombobox options={websiteSources} selected={selectedWebsites} onChange={setSelectedWebsites} placeholder="Chọn một hoặc nhiều website" searchPlaceholder="Tìm kiếm website..." emptyPlaceholder="Không tìm thấy website." />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label>Thời gian kết thúc</Label>
                  <DateTimePicker date={websiteEndDate} setDate={setWebsiteEndDate} />
                </div>
                <div className="space-y-2">
                  <Label>Tần suất quét</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="number" min="1" value={websiteScanFrequency} onChange={(e) => setWebsiteScanFrequency(parseInt(e.target.value, 10))} className="w-20" />
                    <Select value={websiteScanUnit} onValueChange={setWebsiteScanUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Phút</SelectItem>
                        <SelectItem value="hour">Giờ</SelectItem>
                        <SelectItem value="day">Ngày</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleCreateCampaign('Website')} disabled={isCreatingWebsite}>
                    {isCreatingWebsite ? "Đang tạo..." : "Tạo chiến dịch"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="combined" className="pt-6">
          {renderCampaignTab('Tổng hợp', combinedCampaigns, (
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Tên chiến dịch</Label>
                  <Input placeholder="VD: Chiến dịch tổng hợp tháng 8" value={combinedCampaignName} onChange={(e) => setCombinedCampaignName(e.target.value)} />
                </div>
                <div className="flex items-end space-x-4">
                  <div className="space-y-2 flex-1">
                    <Label>Loại chiến dịch</Label>
                    <Input value="Tổng hợp" disabled />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Loại quét Website</Label>
                    <Select value={combinedWebsiteScanType} onValueChange={setCombinedWebsiteScanType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/scrape">/scrape</SelectItem>
                        <SelectItem value="/crawl">/crawl</SelectItem>
                        <SelectItem value="/map">/map</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Chọn Group</Label>
                    {combinedSelectedGroups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{combinedSelectedGroups.length}</span>)}
                  </div>
                  <MultiSelectCombobox options={facebookGroups} selected={combinedSelectedGroups} onChange={setCombinedSelectedGroups} placeholder="Chọn group (tùy chọn)" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Chọn Website</Label>
                    {combinedSelectedWebsites.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{combinedSelectedWebsites.length}</span>)}
                  </div>
                  <MultiSelectCombobox options={websiteSources} selected={combinedSelectedWebsites} onChange={setCombinedSelectedWebsites} placeholder="Chọn website (tùy chọn)" searchPlaceholder="Tìm kiếm website..." emptyPlaceholder="Không tìm thấy website." />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian kết thúc</Label>
                  <DateTimePicker date={combinedEndDate} setDate={setCombinedEndDate} />
                </div>
                <div className="space-y-2">
                  <Label>Tần suất quét</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="number" min="1" value={combinedScanFrequency} onChange={(e) => setCombinedScanFrequency(parseInt(e.target.value, 10))} className="w-20" />
                    <Select value={combinedScanUnit} onValueChange={setCombinedScanUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Phút</SelectItem>
                        <SelectItem value="hour">Giờ</SelectItem>
                        <SelectItem value="day">Ngày</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="lg:col-span-2 flex justify-end">
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleCreateCampaign('Tổng hợp')} disabled={isCreatingCombined}>
                    {isCreatingCombined ? "Đang tạo..." : "Tạo chiến dịch"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <DialogHeader><DialogTitle>Sửa chiến dịch</DialogTitle><DialogDescription>Cập nhật thông tin cho chiến dịch "{editingCampaign?.name}".</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2"><Label>Tên chiến dịch</Label><Input value={updatedCampaignName} onChange={(e) => setUpdatedCampaignName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Loại chiến dịch</Label><Input value={editingCampaign?.type || ''} disabled /></div>
            
            {(editingCampaign?.type === 'Facebook' || editingCampaign?.type === 'Tổng hợp') && (
              <div className="space-y-2 col-span-2">
                <div className="flex items-center space-x-2 mb-2"><Label>Chọn Group</Label>{editSources.groups.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{editSources.groups.length}</span>)}</div>
                <MultiSelectCombobox options={facebookGroups} selected={editSources.groups} onChange={(newGroups) => setUpdatedSelectedSources([...newGroups, ...editSources.websites])} placeholder="Chọn một hoặc nhiều group" searchPlaceholder="Tìm kiếm group..." emptyPlaceholder="Không tìm thấy group." />
              </div>
            )}

            {(editingCampaign?.type === 'Website' || editingCampaign?.type === 'Tổng hợp') && (
              <div className="space-y-2 col-span-2">
                <div className="flex items-center space-x-2 mb-2"><Label>Chọn Website</Label>{editSources.websites.length > 0 && (<span className="bg-brand-orange-light text-gray-900 text-xs font-semibold px-2.5 py-0.5 rounded-full">{editSources.websites.length}</span>)}</div>
                <MultiSelectCombobox options={websiteSources} selected={editSources.websites} onChange={(newWebsites) => setUpdatedSelectedSources([...editSources.groups, ...newWebsites])} placeholder="Chọn một hoặc nhiều website" searchPlaceholder="Tìm kiếm website..." emptyPlaceholder="Không tìm thấy website." />
              </div>
            )}

            {editingCampaign?.type === 'Facebook' && (
              <>
                <div className="space-y-2"><Label>Muốn quét bài từ ngày</Label><DateTimePicker date={updatedScanStartDate} setDate={setUpdatedScanStartDate} /></div>
                <div className="space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={updatedEndDate} setDate={setUpdatedEndDate} /></div>
                <div className="space-y-2 col-span-2">
                  <Label>Từ khoá cần lọc</Label>
                  <Textarea placeholder="Mỗi từ khoá một hàng..." value={updatedKeywords} onChange={(e) => setUpdatedKeywords(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between h-[28px]">
                    <Label>Lọc bằng AI</Label>
                    <div className="flex items-center space-x-2"><Checkbox id="edit-ai-filter" checked={updatedUseAiFilter} onCheckedChange={(checked) => setUpdatedUseAiFilter(checked as boolean)} /><Label htmlFor="edit-ai-filter" className="text-sm font-normal cursor-pointer">Bật</Label></div>
                  </div>
                  <Textarea placeholder="Nhập yêu cầu lọc của bạn cho AI..." value={updatedAiPrompt} onChange={(e) => setUpdatedAiPrompt(e.target.value)} disabled={!updatedUseAiFilter} />
                </div>
              </>
            )}

            {editingCampaign?.type !== 'Facebook' && (
              <>
                <div className="space-y-2"><Label>Thời gian kết thúc</Label><DateTimePicker date={updatedEndDate} setDate={setUpdatedEndDate} /></div>
                <div className="space-y-2">
                  <Label>Loại quét</Label>
                  <Select value={updatedWebsiteScanType} onValueChange={setUpdatedWebsiteScanType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/scrape">/scrape</SelectItem>
                      <SelectItem value="/crawl">/crawl</SelectItem>
                      <SelectItem value="/map">/map</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2"><Label>Tần suất quét</Label><div className="flex items-center space-x-2"><Input type="number" min="1" value={updatedScanFrequency} onChange={(e) => setUpdatedScanFrequency(parseInt(e.target.value, 10))} className="w-24" /><Select value={updatedScanUnit} onValueChange={setUpdatedScanUnit}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minute">Phút</SelectItem><SelectItem value="hour">Giờ</SelectItem><SelectItem value="day">Ngày</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button><Button onClick={handleUpdateCampaign} disabled={isUpdating} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isUpdating ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
          <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Chiến dịch "{deletingCampaign?.name}" sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isDeleting ? "Đang xóa..." : "Xóa"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CampaignDetailsDialog
        campaign={viewingCampaign}
        isOpen={!!viewingCampaign}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingCampaign(null);
          }
        }}
      />
      
      <ScanStatusPopup isOpen={isScanStatusOpen} onOpenChange={setIsScanStatusOpen} activeTab={activeTab} />
    </div>
  );
};

export default Index;