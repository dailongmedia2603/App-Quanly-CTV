import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Income = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thu nhập</h1>
        <p className="text-gray-500 mt-1">
          Theo dõi và quản lý thu nhập của bạn.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Thu nhập" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Income;