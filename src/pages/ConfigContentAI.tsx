import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptTemplateEditor from "@/components/settings/PromptTemplateEditor";
import { PenSquare, MessageSquare, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ConfigContentAI = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');

  if (!isSuperAdmin) {
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
            <CardTitle>Không có quyền truy cập</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Bạn phải là Super Admin để truy cập trang này.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Content AI</h1>
        <p className="text-gray-500 mt-1">
          Quản lý các mẫu prompt và thiết lập cho AI tạo nội dung.
        </p>
      </div>
      <Tabs defaultValue="post" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl rounded-lg border border-orange-200 p-0 bg-white">
          <TabsTrigger value="post" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
            <PenSquare className="h-5 w-5" />
            <span>Prompt Post</span>
          </TabsTrigger>
          <TabsTrigger value="comment" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
            <MessageSquare className="h-5 w-5" />
            <span>Prompt Comment</span>
          </TabsTrigger>
          <TabsTrigger value="consulting" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
            <UserCheck className="h-5 w-5" />
            <span>Prompt Tư vấn</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="post" className="pt-6">
          <PromptTemplateEditor
            templateType="post"
            title="Mẫu Prompt cho Tạo Bài viết"
            description="Cấu hình mẫu prompt mặc định cho chức năng 'Tạo bài viết'. Người dùng sẽ sử dụng mẫu này để yêu cầu AI tạo nội dung."
          />
        </TabsContent>
        <TabsContent value="comment" className="pt-6">
          <PromptTemplateEditor
            templateType="comment"
            title="Mẫu Prompt cho Tạo Comment"
            description="Cấu hình mẫu prompt mặc định cho chức năng 'Tạo comment'. Mẫu này sẽ được dùng để tạo các bình luận tương tác."
          />
        </TabsContent>
        <TabsContent value="consulting" className="pt-6">
          <PromptTemplateEditor
            templateType="consulting"
            title="Mẫu Prompt cho Tư vấn Khách hàng"
            description="Cấu hình mẫu prompt mặc định cho chức năng 'Tư vấn khách hàng'. AI sẽ sử dụng mẫu này để trả lời các câu hỏi của khách hàng."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigContentAI;