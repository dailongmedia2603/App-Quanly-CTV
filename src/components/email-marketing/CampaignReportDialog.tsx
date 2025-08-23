import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReportWidget from '@/components/ReportWidget';
import { Mail, CheckCircle, XCircle, Send } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Campaign } from './SendEmailTab';

interface ReportData {
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  contacts: {
    email: string;
    status: 'pending' | 'success' | 'failed';
  }[];
}

interface CampaignReportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  campaign: Campaign | null;
}

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
          <div>
            <h3 className="font-semibold mb-2">Chi tiết</h3>
            <ScrollArea className="h-64 border rounded-md">
              <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={2} className="text-center">Đang tải...</TableCell></TableRow> : !report || report.contacts.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center">Không có dữ liệu.</TableCell></TableRow> : (
                    report.contacts.map(c => (
                      <TableRow key={c.email}>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
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