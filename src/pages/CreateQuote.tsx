import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreateQuote = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo báo giá tự động</h1>
        <p className="text-gray-500 mt-1">
          Nhập ngân sách của bạn và để AI tạo ra một báo giá chuyên nghiệp.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tạo báo giá" sẽ sớm được hoàn thiện. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateQuote;