import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, Pencil, Trash2, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Campaign } from "@/pages/Index";

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onViewDetails: (campaign: Campaign) => void;
  onManualScan: (campaign: Campaign) => void;
  scanningId: string | null;
}

const CampaignList = ({
  campaigns,
  loading,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
  onManualScan,
  scanningId,
}: CampaignListProps) => {
  const navigate = useNavigate();

  const getScanUnitText = (unit: string) => {
    switch (unit) {
      case "minute":
        return "Phút";
      case "hour":
        return "Giờ";
      case "day":
        return "Ngày";
      default:
        return unit;
    }
  };

  return (
    <div className="border border-orange-200 rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead>Tên chiến dịch</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày bắt đầu quét</TableHead>
            <TableHead>Ngày kết thúc</TableHead>
            <TableHead>Tần suất quét</TableHead>
            <TableHead>Report</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Đang tải danh sách chiến dịch...
              </TableCell>
            </TableRow>
          ) : campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                Chưa có chiến dịch nào trong mục này.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="hover:bg-brand-orange-light/30">
                <TableCell className="font-medium">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-gray-800 hover:text-brand-orange font-medium"
                    onClick={() => onViewDetails(campaign)}
                  >
                    {campaign.name}
                  </Button>
                </TableCell>
                <TableCell>{campaign.type}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "text-white capitalize",
                      campaign.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    )}
                  >
                    {campaign.status === "active" ? "Đang chạy" : "Tạm dừng"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {campaign.scan_start_date
                    ? format(
                        new Date(campaign.scan_start_date),
                        "dd/MM/yyyy HH:mm"
                      )
                    : "Bắt đầu ngay"}
                </TableCell>
                <TableCell>
                  {campaign.end_date
                    ? format(new Date(campaign.end_date), "dd/MM/yyyy HH:mm")
                    : "Không có"}
                </TableCell>
                <TableCell>
                  {`${campaign.scan_frequency} ${getScanUnitText(
                    campaign.scan_unit
                  )}`}
                </TableCell>
                <TableCell>
                  <Button
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white animate-pulse-orange"
                    size="sm"
                    onClick={() => navigate(`/reports?campaign_id=${campaign.id}`)}
                  >
                    Xem report
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onManualScan(campaign)}
                        disabled={scanningId === campaign.id}
                      >
                        <ScanLine className="mr-2 h-4 w-4" />
                        <span>{scanningId === campaign.id ? "Đang quét..." : "Quét ngay"}</span>
                      </DropdownMenuItem>
                      {campaign.status === "active" ? (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(campaign.id, "paused")}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          <span>Tạm dừng</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onStatusChange(campaign.id, "active")}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          <span>Tiếp tục</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(campaign)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Sửa</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(campaign)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Xóa</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignList;