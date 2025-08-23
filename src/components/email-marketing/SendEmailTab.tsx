import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Plus, Trash2, Send, FileText } from 'lucide-react';
import { format } from 'date-fns';
import GmailConnection from './GmailConnection';
import { SendCampaignDialog } from './SendCampaignDialog';
import { CampaignReportDialog } from './CampaignReportDialog';
import { Badge } from '../ui/badge';

interface EmailList { id: string; name: string; }
interface EmailContent { id: string; name: string; }
export interface Campaign { 
  id: string; 
  name: string; 
  status: string; 
  created_at: string; 
  scheduled_at: string | null;
  send_interval_value: number | null;
  send_interval_unit: string | null;
  email_lists: { name: string } | null; 
  email_contents: { name: string } | null; 
}

const SendEmailTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [contents, setContents] = useState<EmailContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedContentId, setSelectedContentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [campaignsRes, listsRes, contentsRes] = await Promise.all([
      supabase.from('email_campaigns').select('*, email_lists(name), email_contents(name)').order('created_at', { ascending: false }),
      supabase.from('email_lists').select('id, name'),
      supabase.from('email_contents').select('id, name')
    ]);
    if (campaignsRes.error || listsRes.error || contentsRes.error) showError("Lỗi tải dữ liệu.");
    else {
      setCampaigns(campaignsRes.data as Campaign[]);
      setLists(listsRes.data as EmailList[]);
      setContents(contentsRes.data as EmailContent[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveCampaign = async () => {
    if (!campaignName || !selectedListId || !selectedContentId) return showError("Vui lòng điền đủ thông tin.");
    setIsSubmitting(true);
    const toastId = showLoading("Đang lưu chiến dịch...");
    const { error } = await supabase.from('email_campaigns').insert({ name: campaignName, email_list_id: selectedListId, email_content_id: selectedContentId });
    dismissToast(toastId);
    if (error) showError(`Lưu thất bại: ${error.message}`);
    else { showSuccess("Lưu thành công!"); setCampaignName(''); setSelectedListId(''); setSelectedContentId(''); fetchData(); }
    setIsSubmitting(false);
  };

  const handleDeleteCampaign = async (id: string) => {
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
    dismissToast(toastId);
    if (error) showError("Xóa thất bại.");
    else { showSuccess("Xóa thành công!"); fetchData(); }
  };

  const handleConfirmSend = async (campaignId: string, settings: any) => {
    setIsSubmitting(true);
    const toastId = showLoading("Đang lên lịch gửi...");
    const { data, error } = await supabase.functions.invoke('schedule-email-campaign', {
      body: { campaign_id: campaignId, ...settings }
    });
    dismissToast(toastId);
    if (error) {
      showError(`Lên lịch thất bại: ${error.message}`);
    } else {
      showSuccess(data.message || "Chiến dịch đã được lên lịch thành công!");
      fetchData();
    }
    setIsSendDialogOpen(false);
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Chưa gửi</Badge>;
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800">Đã lên lịch</Badge>;
      case 'sending': return <Badge className="bg-yellow-100 text-yellow-800">Đang gửi</Badge>;
      case 'sent': return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <GmailConnection />
        <Card className="border-orange-200">
          <CardHeader><CardTitle>Tạo chiến dịch mới</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2"><Label>Tên chiến dịch</Label><Input value={campaignName} onChange={e => setCampaignName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Danh sách mail</Label><Select value={selectedListId} onValueChange={setSelectedListId}><SelectTrigger><SelectValue placeholder="Chọn danh sách" /></SelectTrigger><SelectContent>{lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Nội dung mail</Label><Select value={selectedContentId} onValueChange={setSelectedContentId}><SelectTrigger><SelectValue placeholder="Chọn nội dung" /></SelectTrigger><SelectContent>{contents.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-end"><Button onClick={handleSaveCampaign} disabled={isSubmitting} className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />{isSubmitting ? 'Đang lưu...' : 'Lưu chiến dịch'}</Button></div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader><CardTitle>Danh sách chiến dịch</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Tên chiến dịch</TableHead><TableHead>Danh sách mail</TableHead><TableHead>Nội dung</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày tạo/Lịch gửi</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
              <TableBody>{loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Đang tải...</TableCell></TableRow> : campaigns.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Chưa có chiến dịch nào.</TableCell></TableRow> : (campaigns.map(c => (<TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.email_lists?.name}</TableCell><TableCell>{c.email_contents?.name}</TableCell><TableCell>{getStatusBadge(c.status)}</TableCell><TableCell>{c.status === 'scheduled' && c.scheduled_at ? format(new Date(c.scheduled_at), 'dd/MM/yy HH:mm') : format(new Date(c.created_at), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right space-x-2">
                  {c.status === 'draft' ? (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedCampaign(c); setIsSendDialogOpen(true); }}><Send className="h-4 w-4 mr-2" />Gửi</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedCampaign(c); setIsReportDialogOpen(true); }}><FileText className="h-4 w-4 mr-2" />Xem báo cáo</Button>
                  )}
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteCampaign(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>)))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <SendCampaignDialog isOpen={isSendDialogOpen} onOpenChange={setIsSendDialogOpen} campaign={selectedCampaign} onConfirm={handleConfirmSend} isSubmitting={isSubmitting} />
      <CampaignReportDialog isOpen={isReportDialogOpen} onOpenChange={setIsReportDialogOpen} campaign={selectedCampaign} onCampaignUpdate={fetchData} />
    </>
  );
};

export default SendEmailTab;