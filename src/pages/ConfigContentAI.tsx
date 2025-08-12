import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ConfigContentAI = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Content AI</h1>
        <p className="text-gray-500 mt-1">
          Quản lý các mẫu prompt và thiết lập cho AI tạo nội dung.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Cấu hình Content AI" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigContentAI;