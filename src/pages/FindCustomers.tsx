import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FindCustomers = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tìm khách hàng</h1>
        <p className="text-gray-500 mt-1">
          Công cụ tìm kiếm và phân tích khách hàng tiềm năng.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tìm khách hàng" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FindCustomers;