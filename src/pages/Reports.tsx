import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from './Index';
import ReportWidget from '@/components/ReportWidget';
import CampaignSelector from '@/components/CampaignSelector';
import ReportDetailsTable from '@/components/ReportDetailsTable';
import { BarChart, MessageSquare, Users, AlertCircle } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useSearchParams } from 'react-router-dom';

const Reports = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const campaignIdFromUrl = searchParams.get('campaign_id');

    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      const { data, error } = await supabase
        .from('danh_sach_chien_dich')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
      } else {
        setCampaigns(data as Campaign[]);
        if (campaignIdFromUrl && data.some(c => c.id === campaignIdFromUrl)) {
          setSelectedCampaignId(campaignIdFromUrl);
        } else if (data && data.length > 0) {
          setSelectedCampaignId(data[0].id);
        }
      }
      setLoadingCampaigns(false);
    };

    fetchCampaigns();
  }, [searchParams]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo</h1>
        <p className="text-gray-500 mt-1">
          Theo dõi kết quả được trả về khi chiến dịch được chạy.
        </p>
      </div>

      {/* Report Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportWidget
          icon={<BarChart className="h-5 w-5" />}
          title="Tổng số kết quả"
          value="1,234"
          change={12}
        />
        <ReportWidget
          icon={<MessageSquare className="h-5 w-5" />}
          title="Bình luận tích cực"
          value="820"
          change={5}
        />
        <ReportWidget
          icon={<Users className="h-5 w-5" />}
          title="Lượt tiếp cận"
          value="15,6k"
          change={-2}
        />
        <ReportWidget
          icon={<AlertCircle className="h-5 w-5" />}
          title="Bình luận tiêu cực"
          value="56"
          change={-10}
        />
      </div>

      {/* Main Content */}
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] w-full"
      >
        <ResizablePanel defaultSize={20} minSize={20} maxSize={40}>
          <CampaignSelector
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
            loading={loadingCampaigns}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className="mx-2" />
        <ResizablePanel defaultSize={80}>
          <ReportDetailsTable selectedCampaign={selectedCampaign} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Reports;