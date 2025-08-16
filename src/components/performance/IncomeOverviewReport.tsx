import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const IncomeOverviewReport = () => {
  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Tổng quan Thu nhập</CardTitle>
        <CardDescription>
          Báo cáo chi tiết về lương, hoa hồng và thu nhập của các cộng tác viên.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Biểu đồ và dữ liệu chi tiết sẽ được hiển thị ở đây.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeOverviewReport;