import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ListFilter, Activity, History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface CampaignFilters {
  status: 'all' | 'active' | 'paused';
}

interface CampaignToolbarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  filters: CampaignFilters;
  onFiltersChange: (filters: CampaignFilters) => void;
  onScanStatusClick: () => void;
  onScanHistoryClick: () => void;
}

const CampaignToolbar = ({ searchTerm, onSearchTermChange, filters, onFiltersChange, onScanStatusClick, onScanHistoryClick }: CampaignToolbarProps) => {
  return (
    <div className="flex items-center justify-between space-x-4 mt-6 mb-4">
      <div className="flex items-center space-x-2 flex-1">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên chiến dịch..."
            className="pl-10 border-orange-200 focus-visible:ring-brand-orange"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2 border-orange-200 text-gray-700 hover:bg-brand-orange-light hover:text-brand-orange">
              <ListFilter className="h-4 w-4" />
              <span>Bộ lọc</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium leading-none">Lọc chiến dịch</h4>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFiltersChange({ ...filters, status: value as CampaignFilters['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Đang chạy</SelectItem>
                    <SelectItem value="paused">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" className="flex items-center space-x-2 border-orange-200 text-gray-700 hover:bg-brand-orange-light hover:text-brand-orange" onClick={onScanHistoryClick}>
          <History className="h-4 w-4" />
          <span>Lịch sử quét</span>
        </Button>
        <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2" onClick={onScanStatusClick}>
          <Activity className="h-4 w-4" />
          <span>Trạng thái quét</span>
        </Button>
      </div>
    </div>
  );
};

export default CampaignToolbar;