import VideoGuidesTab from "@/components/guide/VideoGuidesTab";
import { Video } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Guide = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Hướng dẫn sử dụng hệ thống</h1>
        <p className="text-muted-foreground mt-2 hidden md:block">
          Chào mừng bạn đến với hệ thống Cộng tác viên của Dailong Media! Đây là không gian làm việc được thiết kế dành riêng cho bạn, tích hợp những công cụ mạnh mẽ để giúp bạn tìm kiếm khách hàng, sáng tạo nội dung và quản lý thu nhập một cách hiệu quả nhất. Hãy cùng khám phá các tính năng chính nhé!
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="video-guides" className="border border-orange-200 rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b data-[state=open]:border-orange-100">
            <div className="flex items-center space-x-3">
              <Video className="h-6 w-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-gray-800">Video hướng dẫn</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <VideoGuidesTab />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Guide;