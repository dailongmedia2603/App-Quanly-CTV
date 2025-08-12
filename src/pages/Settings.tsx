import { useAuth } from "@/contexts/AuthContext";
import SupportWidgetSettings from "@/components/settings/SupportWidgetSettings";
import ApiKeysSettings from "@/components/settings/ApiKeysSettings";
import BankInfoSettings from "@/components/settings/BankInfoSettings";
import PricingPlanSettings from "@/components/settings/PricingPlanSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, ToyBrick, Landmark, Ticket } from "lucide-react";

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
      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys"><KeyRound className="mr-2 h-4 w-4" />API Keys</TabsTrigger>
          <TabsTrigger value="pricing"><Ticket className="mr-2 h-4 w-4" />Bảng giá</TabsTrigger>
          <TabsTrigger value="payment"><Landmark className="mr-2 h-4 w-4" />Thanh toán</TabsTrigger>
          <TabsTrigger value="support-widget"><ToyBrick className="mr-2 h-4 w-4" />Widget Hỗ trợ</TabsTrigger>
        </TabsList>
        <TabsContent value="api-keys" className="pt-6">
          <ApiKeysSettings />
        </TabsContent>
        <TabsContent value="pricing" className="pt-6">
          <PricingPlanSettings />
        </TabsContent>
        <TabsContent value="payment" className="pt-6">
          <BankInfoSettings />
        </TabsContent>
        <TabsContent value="support-widget" className="pt-6">
          <SupportWidgetSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;