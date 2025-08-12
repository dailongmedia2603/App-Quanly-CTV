import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CreateComment = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo comment</h1>
        <p className="text-gray-500 mt-1">
          Tạo các bình luận tương tác tự động.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tính năng đang được phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Trang "Tạo comment" sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateComment;