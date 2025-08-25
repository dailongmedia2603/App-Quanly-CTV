import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Campaign } from "@/types"; // Import Campaign from types

interface CampaignDetailsDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignDetailsDialog({
  campaign,
  isOpen,
  onClose,
}: CampaignDetailsDialogProps) {
  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>Chi tiết chiến dịch email.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium text-gray-500">ID:</span>
              <span className="col-span-3 text-sm">{campaign.id}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Tên:</span>
              <span className="col-span-3 text-sm">{campaign.name}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Trạng thái:</span>
              <span className="col-span-3 text-sm">{campaign.status}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Ngày tạo:</span>
              <span className="col-span-3 text-sm">
                {new Date(campaign.created_at).toLocaleString()}
              </span>
            </div>
            {campaign.scheduled_at && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">Lên lịch gửi:</span>
                <span className="col-span-3 text-sm">
                  {new Date(campaign.scheduled_at).toLocaleString()}
                </span>
              </div>
            )}
            {campaign.sent_at && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">Đã gửi lúc:</span>
                <span className="col-span-3 text-sm">
                  {new Date(campaign.sent_at).toLocaleString()}
                </span>
              </div>
            )}
            {campaign.last_sent_at && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">Lần gửi cuối:</span>
                <span className="col-span-3 text-sm">
                  {new Date(campaign.last_sent_at).toLocaleString()}
                </span>
              </div>
            )}
            {campaign.send_interval_value && campaign.send_interval_unit && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">Khoảng thời gian gửi:</span>
                <span className="col-span-3 text-sm">
                  {campaign.send_interval_value} {campaign.send_interval_unit}
                </span>
              </div>
            )}
            {campaign.email_list_id && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">ID Danh sách Email:</span>
                <span className="col-span-3 text-sm">{campaign.email_list_id}</span>
              </div>
            )}
            {campaign.email_content_ids && campaign.email_content_ids.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">ID Nội dung Email:</span>
                <div className="col-span-3 text-sm flex flex-wrap gap-1">
                  {campaign.email_content_ids.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}