import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Campaign } from "@/pages/Index";
import { ScrollArea } from "./ui/scroll-area";

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  loading: boolean;
}

const CampaignSelector = ({ campaigns, selectedCampaignId, onSelectCampaign, loading }: CampaignSelectorProps) => {
  return (
    <Card className="border-orange-200 h-full flex flex-col">
      <CardHeader>
        <CardTitle>Chọn chiến dịch</CardTitle>
        <CardDescription>Chọn một chiến dịch để xem báo cáo chi tiết.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {loading ? (
          <div className="text-center text-gray-500">Đang tải chiến dịch...</div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-4">
              {campaigns.map(campaign => (
                <Button
                  key={campaign.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-auto py-2",
                    selectedCampaignId === campaign.id && "bg-brand-orange-light text-brand-orange"
                  )}
                  onClick={() => onSelectCampaign(campaign.id)}
                >
                  {campaign.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignSelector;