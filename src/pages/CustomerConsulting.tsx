import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CustomerConsulting = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tư vấn khách hàng</h1>
        <p className="text-gray-500 mt-1">
          Công cụ AI hỗ trợ tư vấn và trả lời khách hàng.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tư vấn khách hàng" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerConsulting;