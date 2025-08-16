import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Users, Award, Activity } from "lucide-react";
import ReportWidget from "@/components/ReportWidget";
import IncomeOverviewReport from "@/components/performance/IncomeOverviewReport";
import CollaboratorRanking from "@/components/performance/CollaboratorRanking";
import UserActivityReport from "@/components/performance/UserActivityReport";

const PerformanceReport = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo hiệu suất</h1>
        <p className="text-gray-500 mt-1">
          Tổng quan về hiệu suất hoạt động, thu nhập và xếp hạng của các cộng tác viên.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportWidget
          icon={<BarChart className="h-5 w-5" />}
          title="Tổng doanh thu tháng này"
          value="125.000.000đ"
          change={15}
          changeType="month"
        />
        <ReportWidget
          icon={<Users className="h-5 w-5" />}
          title="CTV hoạt động"
          value="12"
        />
        <ReportWidget
          icon={<Award className="h-5 w-5" />}
          title="CTV xuất sắc nhất"
          value="Hữu Long"
        />
        <ReportWidget
          icon={<Activity className="h-5 w-5" />}
          title="Hoạt động hôm nay"
          value="156"
          change={-5}
          changeType="week"
        />
      </div>

      <Tabs defaultValue="income_overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl rounded-lg border border-orange-200 p-0 bg-white">
          <TabsTrigger value="income_overview" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
            <BarChart className="h-4 w-4" />
            <span>Tổng quan Thu nhập</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
            <Award className="h-4 w-4" />
            <span>Xếp hạng CTV</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
            <Activity className="h-4 w-4" />
            <span>Hoạt động User</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="income_overview" className="pt-6">
          <IncomeOverviewReport />
        </TabsContent>
        <TabsContent value="ranking" className="pt-6">
          <CollaboratorRanking />
        </TabsContent>
        <TabsContent value="activity" className="pt-6">
          <UserActivityReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceReport;