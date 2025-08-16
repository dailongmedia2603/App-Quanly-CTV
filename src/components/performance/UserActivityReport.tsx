import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

const UserActivityReport = () => {
  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Hoạt động User</CardTitle>
        <CardDescription>
          Phân tích tần suất và các hành động chính của người dùng trên hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Activity className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Tính năng đang được phát triển</h3>
          <p className="text-sm text-gray-500">Báo cáo hoạt động người dùng sẽ sớm ra mắt.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActivityReport;