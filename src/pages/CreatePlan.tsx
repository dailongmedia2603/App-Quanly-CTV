import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreatePlan = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo Plan</h1>
        <p className="text-gray-500 mt-1">
          Xây dựng kế hoạch nội dung chi tiết.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tạo Plan" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePlan;