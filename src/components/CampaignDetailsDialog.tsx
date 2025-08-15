import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Type,
  Calendar,
  Clock,
  Facebook,
  BrainCircuit,
  FileText,
  CheckCircle,
  XCircle,
  Info,
  Timer,
  CalendarDays,
  Tags,
  Bot,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Campaign } from "@/pages/Index";
import { ScrollArea } from "./ui/scroll-area";

interface CampaignDetailsDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const DetailItem = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 mt-1">
      <Icon className="h-5 w-5 text-brand-orange" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="text-base font-semibold text-gray-800">{children}</div>
    </div>
  </div>
);

const getScanUnitText = (unit: string) => {
  switch (unit) {
    case "minute": return "Phút";
    case "hour": return "Giờ";
    case "day": return "Ngày";
    default: return unit;
  }
};

export const CampaignDetailsDialog = ({
  campaign,
  isOpen,
  onOpenChange,
}: CampaignDetailsDialogProps) => {
  if (!campaign) return null;

  const {
    name,
    type,
    status,
    sources,
    scan_frequency,
    scan_unit,
    scan_start_date,
    end_date,
    keywords,
    ai_filter_enabled,
    ai_prompt,
  } = campaign;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white via-brand-orange-light/50 to-white p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <Info className="h-6 w-6 text-brand-orange" />
            <span className="text-2xl font-bold text-gray-800">
              Chi tiết chiến dịch
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-white/50 rounded-lg border border-orange-100">
              <DetailItem icon={Info} label="Tên chiến dịch">
                {name}
              </DetailItem>

              <DetailItem icon={Type} label="Loại chiến dịch">
                <Badge
                  variant="outline"
                  className="text-base font-semibold border-blue-500 text-blue-600 bg-blue-50"
                >
                  {type}
                </Badge>
              </DetailItem>

              <DetailItem icon={Timer} label="Trạng thái">
                <Badge
                  className={cn(
                    "text-white capitalize",
                    status === "active" ? "bg-green-500" : "bg-gray-500"
                  )}
                >
                  {status === "active" ? "Đang chạy" : "Tạm dừng"}
                </Badge>
              </DetailItem>

              <DetailItem icon={Clock} label="Tần suất quét">
                {`${scan_frequency} ${getScanUnitText(scan_unit)} / lần`}
              </DetailItem>

              <DetailItem icon={CalendarDays} label="Ngày bắt đầu quét">
                {scan_start_date
                  ? format(new Date(scan_start_date), "dd/MM/yyyy, HH:mm")
                  : "Bắt đầu ngay"}
              </DetailItem>

              <DetailItem icon={Calendar} label="Ngày kết thúc">
                {end_date
                  ? format(new Date(end_date), "dd/MM/yyyy, HH:mm")
                  : "Không có"}
              </DetailItem>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 flex items-center"><Facebook className="h-5 w-5 mr-2 text-blue-600"/>Nguồn Facebook</h3>
              <div className="p-4 border rounded-lg bg-white/60 max-h-40 overflow-y-auto">
                <ul className="space-y-1 list-disc list-inside">
                  {sources.map((source, index) => (
                    <li key={index} className="text-sm font-mono text-gray-600">{source}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DetailItem icon={Tags} label="Từ khóa cần lọc">
                {keywords ? (
                  <pre className="text-sm font-sans bg-gray-100 p-2 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {keywords}
                  </pre>
                ) : (
                  "Không có"
                )}
              </DetailItem>
              <div className="space-y-4">
                <DetailItem icon={Bot} label="Lọc bằng AI">
                  {ai_filter_enabled ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" /> Bật
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <XCircle className="h-5 w-5 mr-2" /> Tắt
                    </span>
                  )}
                </DetailItem>
                {ai_filter_enabled && (
                  <DetailItem icon={BrainCircuit} label="Yêu cầu AI">
                    {ai_prompt ? (
                      <p className="text-sm font-normal text-gray-700 bg-gray-100 p-2 rounded-md max-h-40 overflow-y-auto">
                        {ai_prompt}
                      </p>
                    ) : (
                      "Không có"
                    )}
                  </DetailItem>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 bg-white/20 border-t border-orange-100">
          <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white w-full sm:w-auto animate-pulse-orange">
            <FileText className="mr-2 h-4 w-4" />
            Xem báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};