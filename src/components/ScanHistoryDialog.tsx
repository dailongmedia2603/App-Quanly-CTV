import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Code, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScanHistoryLog {
  id: string;
  scan_time: string;
  status: 'success' | 'error' | 'info';
  message: string;
  details: any;
  source_type: string | null;
  campaign: { name: string } | null;
}

interface ScanHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: ScanHistoryLog[];
  loading: boolean;
}

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <dt className="font-medium text-gray-500">{label}</dt>
    <dd className="col-span-2 text-gray-800">{value || 'N/A'}</dd>
  </div>
);

const formatApiResponse = (response: any) => {
  if (typeof response === 'string') {
    try {
      return JSON.stringify(JSON.parse(response), null, 2);
    } catch (e) {
      return response;
    }
  }
  if (typeof response === 'object' && response !== null) {
    return JSON.stringify(response, null, 2);
  }
  return String(response);
};

const ApiCallResponseDetails = ({ response }: { response: any }) => {
  if (typeof response !== 'object' || response === null) {
    return <pre className="text-xs whitespace-pre-wrap break-all bg-gray-800 text-white p-2 rounded-md max-h-60 overflow-auto">{formatApiResponse(response)}</pre>;
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <DetailItem label="Số bài viết nhận được" value={<Badge variant="secondary">{response.posts_received}</Badge>} />
        <DetailItem label="Còn trang tiếp theo" value={<Badge variant={response.has_next_page ? 'default' : 'secondary'} className={cn(response.has_next_page && 'bg-green-100 text-green-800')}>{response.has_next_page ? 'Có' : 'Không'}</Badge>} />
      </div>
      {response.error_message && <DetailItem label="Thông báo lỗi" value={<span className="text-red-600 font-mono">{response.error_message}</span>} />}
      <div>
        <p className="font-medium text-gray-500 mb-1">Xem trước dữ liệu thô</p>
        <pre className="whitespace-pre-wrap break-all bg-gray-800 text-white p-2 rounded-md max-h-40 overflow-auto">{response.raw_preview}</pre>
      </div>
    </div>
  );
};

export const ScanHistoryDialog = ({ isOpen, onOpenChange, logs, loading }: ScanHistoryDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white p-0">
        <DialogHeader className="p-6 pb-4 border-b border-orange-100">
          <DialogTitle className="text-2xl font-bold text-gray-800">Lịch sử quét</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-500">Đang tải lịch sử...</p>
            ) : logs.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-medium">Chưa có lịch sử quét nào</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {logs.map((log) => {
                  const details = log.details || {};
                  const foundPosts = details.found_posts ?? details.found_items ?? 'N/A';
                  const sinceReadable = details['since (readable)'] || 'N/A';
                  const untilReadable = details['until (readable)'] || 'N/A';

                  return (
                    <AccordionItem value={log.id} key={log.id} className="border border-orange-100 rounded-lg bg-white/50">
                      <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full text-sm">
                          <div className="flex items-center space-x-4">
                            {log.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                            <div className="text-left">
                              <p className="font-semibold text-gray-800">{log.campaign?.name || 'Chiến dịch không xác định'}</p>
                              <p className="text-gray-600">{log.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-gray-500">
                            <span><strong className="text-gray-700">{foundPosts}</strong> kết quả</span>
                            <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" />{format(new Date(log.scan_time), "dd/MM/yy, HH:mm")}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                        <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                          <h4 className="font-semibold">Chi tiết phiên quét</h4>
                          <dl className="space-y-2">
                            <DetailItem label="Thời gian bắt đầu" value={sinceReadable} />
                            <DetailItem label="Thời gian kết thúc" value={untilReadable} />
                            <DetailItem label="Nguồn quét" value={<Badge variant="outline">{log.source_type}</Badge>} />
                          </dl>
                          {details.api_calls && details.api_calls.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-semibold mt-4">Lịch sử gọi API</h5>
                              <Accordion type="multiple" className="w-full space-y-1">
                                {details.api_calls.map((call: any, index: number) => (
                                  <AccordionItem value={`call-${index}`} key={index} className="border rounded-md bg-white">
                                    <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="font-mono truncate max-w-md">{call.url}</span>
                                        <Badge variant={call.status === 200 ? 'default' : 'destructive'} className={cn(call.status === 200 && 'bg-green-500')}>Status: {call.status}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-3">
                                      <ApiCallResponseDetails response={call.response} />
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};