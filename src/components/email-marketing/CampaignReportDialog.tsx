import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReportWidget from '@/components/ReportWidget';
import { Mail, CheckCircle, XCircle, Clock, Repeat, Eye, MousePointerClick, History, FileCode } from 'lucide-react';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Campaign } from './SendEmailTab';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReportData {
  stats: {
    total: number;
    success: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  contacts: {
    email: string;
    status: 'pending' | 'success' | 'failed';
    sent_at: string | null;
    error_message: string | null;
    content_name: string | null;
    opened_at: string | null;
    clicked_at: string | null;
    sent_html_content: string | null;
  }[];
}

interface CampaignReportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  campaign: Campaign | null;
  onCampaignUpdate: () => void;
}

export const CampaignReportDialog = ({ isOpen, onOpenChange, campaign, onCampaignUpdate }: CampaignReportDialogProps) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState<{ email: string; content: string } | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!campaign) return;
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

    if (isOpen) {
      fetchReport();
    }

    if (isOpen && campaign) {
      const channel = supabase
        .channel(`campaign-report-${campaign.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'email_campaign_logs',
            filter: `campaign_id=eq.${campaign.id}`,
          },
          () => {
            fetchReport();
            onCampaignUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, campaign]);

  const handleResendFailed = async () => {
    if (!campaign) return;
    setIsResending(true);
    const toastId = showLoading("Đang yêu cầu gửi lại...");

    const { data, error } = await supabase.functions.invoke('resend-failed-emails', {
      body: { campaign_id: campaign.id }
    });

    dismissToast(toastId);
    if (error) {
      showError(`Gửi lại thất bại: ${error.message}`);
    } else {
      showSuccess(data.message || "Đã lên lịch gửi lại các email thất bại.");
      onCampaignUpdate();
      onOpenChange(false);
    }
    setIsResending(false);
  };

  const getStatusBadge = (status: string, errorMessage: string | null) => {
    const badge = (() => {
      switch (status) {
        case 'pending': return <Badge variant="secondary">Chưa gửi</Badge>;
        case 'success': return <Badge className="bg-green-100 text-green-800">Đã gửi</Badge>;
        case 'failed': return <Badge variant="destructive">Thất bại</Badge>;
        default: return <Badge>{status}</Badge>;
      }
    })();

    if (status === 'failed' && errorMessage) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent><p>{errorMessage}</p></TooltipContent>
        </Tooltip>
      );
    }
    return badge;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <TooltipProvider>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle>Báo cáo chiến dịch: {campaign?.name}</DialogTitle>
                  <DialogDescription>Theo dõi trạng thái gửi email của chiến dịch.</DialogDescription>
                </div>
                <Button variant="outline" onClick={() => setIsLogsOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  Xem Logs
                </Button>
              </div>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ReportWidget icon={<Mail className="h-5 w-5" />} title="Tổng số mail" value={report?.stats.total.toString() || '0'} />
                <ReportWidget icon={<CheckCircle className="h-5 w-5" />} title="Thành công" value={report?.stats.success.toString() || '0'} />
                <ReportWidget icon={<Eye className="h-5 w-5" />} title="Đã mở" value={report?.stats.opened.toString() || '0'} />
                <ReportWidget icon={<MousePointerClick className="h-5 w-5" />} title="Đã click" value={report?.stats.clicked.toString() || '0'} />
                <ReportWidget icon={<XCircle className="h-5 w-5" />} title="Thất bại" value={report?.stats.failed.toString() || '0'} />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Chi tiết</h3>
                <ScrollArea className="h-64 border rounded-md">
                  <Table>
                    <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Nội dung</TableHead><TableHead>Trạng thái</TableHead><TableHead>Thời gian gửi</TableHead><TableHead>Đã mở</TableHead><TableHead>Đã click</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {loading ? <TableRow><TableCell colSpan={6} className="text-center">Đang tải...</TableCell></TableRow> : !report || report.contacts.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center">Không có dữ liệu.</TableCell></TableRow> : (
                        report.contacts.map(c => (
                          <TableRow key={c.email}>
                            <TableCell className="font-medium">{c.email}</TableCell>
                            <TableCell className="text-gray-600">{c.content_name || '-'}</TableCell>
                            <TableCell>{getStatusBadge(c.status, c.error_message)}</TableCell>
                            <TableCell className="text-gray-600">{c.sent_at ? format(new Date(c.sent_at), 'dd/MM/yy HH:mm:ss') : '-'}</TableCell>
                            <TableCell>{c.opened_at ? <CheckCircle className="h-5 w-5 text-green-500" /> : '-'}</TableCell>
                            <TableCell>{c.clicked_at ? <CheckCircle className="h-5 w-5 text-green-500" /> : '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              {report && report.stats.failed > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleResendFailed} 
                  disabled={isResending}
                  className="mr-auto text-brand-orange border-brand-orange hover:bg-brand-orange-light hover:text-brand-orange"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  {isResending ? 'Đang xử lý...' : `Gửi lại ${report.stats.failed} mail lỗi`}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </TooltipProvider>
      </Dialog>

      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Logs nội dung đã gửi</DialogTitle>
            <DialogDescription>Xem nội dung HTML chính xác đã được gửi cho từng email.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!report || report.contacts.filter(c => c.status === 'success').length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">Chưa có email nào được gửi thành công.</TableCell></TableRow>
                ) : (
                  report.contacts.filter(c => c.status === 'success').map(contact => (
                    <TableRow key={contact.email}>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.content_name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setHtmlContent({ email: contact.email, content: contact.sent_html_content || 'Không có nội dung để hiển thị.' })}>
                          <FileCode className="h-4 w-4 mr-2" />
                          Xem HTML
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!htmlContent} onOpenChange={(open) => !open && setHtmlContent(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nội dung HTML gửi tới: {htmlContent?.email}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] mt-4">
            <pre className="text-xs bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
              {htmlContent?.content}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHtmlContent(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};