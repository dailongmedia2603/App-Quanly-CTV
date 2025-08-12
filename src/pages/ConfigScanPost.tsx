import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ConfigScanPost = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Quét Post</h1>
        <p className="text-gray-500 mt-1">
          Thiết lập các tham số cho việc quét bài viết.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Cấu hình Quét Post" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigScanPost;