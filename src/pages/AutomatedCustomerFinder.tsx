import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AutomatedCustomerFinder = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tìm KH tự động</h1>
        <p className="text-gray-500 mt-1">
          Công cụ tự động tìm kiếm khách hàng tiềm năng.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tìm KH tự động" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedCustomerFinder;