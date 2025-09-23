import { useAuth } from "@/contexts/AuthContext";
import GeneralSettings from "@/components/settings/GeneralSettings";
import ApiKeysSettings from "@/components/settings/ApiKeysSettings";
import ManualActionLogTab from "@/components/settings/ManualActionLogTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, KeyRound, History } from "lucide-react";

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
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg rounded-lg border border-orange-200 p-0 bg-white">
          <TabsTrigger value="general" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
            <SettingsIcon className="h-4 w-4" />
            <span>Cài đặt chung</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
            <KeyRound className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="action-logs" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
            <History className="h-4 w-4" />
            <span>Lịch sử Hành động</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pt-6">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="api-keys" className="pt-6">
          <ApiKeysSettings />
        </TabsContent>
        <TabsContent value="action-logs" className="pt-6">
          <ManualActionLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;