import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Users, Award, Activity } from "lucide-react";
import ReportWidget from "@/components/ReportWidget";
import CollaboratorRanking from "@/components/performance/CollaboratorRanking";
import UserActivityReport from "@/components/performance/UserActivityReport";
import { format } from 'date-fns';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return '0đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const PerformanceReport = () => {
  const [widgetData, setWidgetData] = useState({
    totalRevenue: 0,
    activeCtvCount: 0,
    topCollaborator: 'N/A',
    todayActivityCount: 0,
  });
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  useEffect(() => {
    const fetchWidgetData = async () => {
      setLoadingWidgets(true);
      try {
        const today = new Date();
        const currentMonth = format(today, 'yyyy-MM-dd');

        const [revenueRes, usersRes, activityRes, incomeRes] = await Promise.all([
          supabase.rpc('get_monthly_revenue', { target_month: currentMonth }),
          supabase.functions.invoke("admin-get-users-with-roles"),
          supabase.rpc('get_user_activity_stats', { start_date: currentMonth, end_date: currentMonth }),
          supabase.rpc('get_all_income_stats_for_month', { target_month: currentMonth })
        ]);

        const totalRevenue = revenueRes.data || 0;
        const activeCtvCount = usersRes.data?.users?.length || 0;

        let todayActivityCount = 0;
        if (activityRes.data) {
          todayActivityCount = activityRes.data.reduce((sum: number, user: any) => {
            return sum + user.post_count + user.comment_count + user.consulting_session_count + user.total_messages_count;
          }, 0);
        }

        let topCollaborator = 'N/A';
        if (incomeRes.data && incomeRes.data.length > 0) {
          const top = incomeRes.data.reduce((prev: any, current: any) => (prev.total_income > current.total_income) ? prev : current);
          topCollaborator = top.full_name;
        }

        setWidgetData({
          totalRevenue,
          activeCtvCount,
          topCollaborator,
          todayActivityCount,
        });

      } catch (error) {
        console.error("Error fetching widget data:", error);
        showError("Không thể tải dữ liệu cho các widget.");
      } finally {
        setLoadingWidgets(false);
      }
    };

    fetchWidgetData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo hiệu suất</h1>
        <p className="text-gray-500 mt-1">
          Tổng quan về hiệu suất hoạt động, thu nhập và xếp hạng của các cộng tác viên.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingWidgets ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          <>
            <ReportWidget
              icon={<BarChart className="h-5 w-5" />}
              title="Tổng doanh thu tháng này"
              value={formatCurrency(widgetData.totalRevenue)}
            />
            <ReportWidget
              icon={<Users className="h-5 w-5" />}
              title="CTV hoạt động"
              value={widgetData.activeCtvCount.toString()}
            />
            <ReportWidget
              icon={<Award className="h-5 w-5" />}
              title="CTV xuất sắc nhất"
              value={widgetData.topCollaborator}
            />
            <ReportWidget
              icon={<Activity className="h-5 w-5" />}
              title="Hoạt động hôm nay"
              value={widgetData.todayActivityCount.toString()}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xl rounded-lg border border-orange-200 p-0 bg-white overflow-hidden">
          <TabsTrigger value="ranking" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
            <Award className="h-4 w-4" />
            <span>Xếp hạng CTV</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
            <Activity className="h-4 w-4" />
            <span>Hoạt động User</span>
          </TabsTrigger>
        </TabsList>
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