import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReportWidget from '@/components/ReportWidget';
import { Mail, CheckCircle, XCircle, Clock, Repeat } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Campaign } from './SendEmailTab';
import { format } from 'date-fns';

interface ReportData {
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  contacts: {
    email: string;
    status: 'pending' | 'success' | 'failed';
    sent_at: string | null;
  }[];
}

interface CampaignReportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  campaign: Campaign | null;
}

const getIntervalUnitText = (unit: string | null) => {
  if (!unit) return '';
  switch (unit) {
    case 'minute': return 'Phút';
    case 'hour': return 'Giờ';
    case 'day': return 'Ngày';
    default: return unit;
  }
};

export const CampaignReportDialog = ({ isOpen, onOpenChange, campaign }: CampaignReportDialogProps) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!isOpen || !campaign) return;
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-email-campaign-report', {
        body: { campaign_id: campaign.id }
      });
      if (error) {
        showError("Không thể tải báo cáo.");
        setReport(null);
      } else {
        setReport(data);
      }
      setLoading(false);
    };
    fetchReport();
  }, [isOpen, campaign]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Chưa gửi</Badge>;
      case 'success': return <Badge className="bg-green-100 text-green-800">Đã gửi</Badge>;
      case 'failed': return <Badge variant="destructive">Thất bại</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Báo cáo chiến dịch: {campaign?.name}</DialogTitle>
          <DialogDescription>Theo dõi trạng thái gửi email của chiến dịch.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <ReportWidget icon={<Mail className="h-5 w-5" />} title="Tổng số mail" value={report?.stats.total.toString() || '0'} />
            <ReportWidget icon={<CheckCircle className="h-5 w-5" />} title="Thành công" value={report?.stats.success.toString() || '0'} />
            <ReportWidget icon={<XCircle className="h-5 w-5" />} title="Thất bại" value={report?.stats.failed.toString() || '0'} />
          </div>

          {campaign && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
                  <p className="font-semibold text-gray-800">
                    {campaign.scheduled_at ? format(new Date(campaign.scheduled_at), 'dd/MM/yyyy, HH:mm') : 'Gửi ngay lập tức'}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Repeat className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Tần suất gửi</p>
                  <p className="font-semibold text-gray-800">
                    {campaign.send_interval_value && campaign.send_interval_unit
                      ? `${campaign.send_interval_value} ${getIntervalUnitText(campaign.send_interval_unit)} / email`
                      : 'Không có'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Chi tiết</h3>
            <ScrollArea className="h-64 border rounded-md">
              <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Trạng thái</TableHead><TableHead>Thời gian gửi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={3} className="text-center">Đang tải...</TableCell></TableRow> : !report || report.contacts.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center">Không có dữ liệu.</TableCell></TableRow> : (
                    report.contacts.map(c => (
                      <TableRow key={c.email}>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell>
                          {c.sent_at ? format(new Date(c.sent_at), 'dd/MM/yy HH:mm:ss') : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};