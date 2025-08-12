import { useAuth } from "@/contexts/AuthContext";
import SupportWidgetSettings from "@/components/settings/SupportWidgetSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt</h1>
          <p className="text-gray-500 mt-1">Quản lý các cài đặt của bạn.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Không có quyền truy cập</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bạn không có quyền truy cập vào các cài đặt của quản trị viên.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt Quản trị viên</h1>
        <p className="text-gray-500 mt-1">Quản lý các cài đặt chung của toàn bộ ứng dụng.</p>
      </div>
      <SupportWidgetSettings />
    </div>
  );
};

export default Settings;