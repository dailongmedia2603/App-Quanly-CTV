import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreatePost = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo bài viết</h1>
        <p className="text-gray-500 mt-1">
          Sử dụng AI để tạo ra các bài viết hấp dẫn.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tạo bài viết" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;