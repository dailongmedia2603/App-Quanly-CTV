import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentationTab from "@/components/guide/DocumentationTab";
import VideoGuidesTab from "@/components/guide/VideoGuidesTab";
import { Video, BookText, BookOpen } from "lucide-react";

const Guide = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 bg-brand-orange-light p-3 rounded-full">
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-brand-orange" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Hướng dẫn sử dụng hệ thống</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Chào mừng bạn đến với hệ thống Cộng tác viên của Dailong Media! Đây là không gian làm việc được thiết kế dành riêng cho bạn, tích hợp những công cụ mạnh mẽ để giúp bạn tìm kiếm khách hàng, sáng tạo nội dung và quản lý thu nhập một cách hiệu quả nhất. Hãy cùng khám phá các tính năng chính nhé!
          </p>
        </div>
      </div>
      <Tabs defaultValue="video" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md rounded-lg border border-orange-200 p-0 bg-white">
          <TabsTrigger value="video" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
            <Video className="h-4 w-4" />
            <span>Video hướng dẫn</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
            <BookText className="h-4 w-4" />
            <span>Tài liệu</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="video" className="pt-6">
          <VideoGuidesTab />
        </TabsContent>
        <TabsContent value="docs" className="pt-6">
          <DocumentationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Guide;