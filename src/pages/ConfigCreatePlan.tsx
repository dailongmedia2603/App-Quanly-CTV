import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ConfigCreatePlan = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Tạo Plan</h1>
        <p className="text-gray-500 mt-1">
          Thiết lập các mẫu và quy trình cho việc tạo kế hoạch nội dung.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Cấu hình Tạo Plan" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigCreatePlan;