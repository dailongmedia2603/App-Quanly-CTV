import VideoGuidesTab from "@/components/guide/VideoGuidesTab";
import { Video } from "lucide-react";

const Guide = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Hướng dẫn sử dụng hệ thống</h1>
        <p className="text-muted-foreground mt-2 hidden md:block">
          Chào mừng bạn đến với hệ thống Cộng tác viên của Dailong Media! Đây là không gian làm việc được thiết kế dành riêng cho bạn, tích hợp những công cụ mạnh mẽ để giúp bạn tìm kiếm khách hàng, sáng tạo nội dung và quản lý thu nhập một cách hiệu quả nhất. Hãy cùng khám phá các tính năng chính nhé!
        </p>
      </div>
      <div>
        <div className="flex items-center space-x-2 mb-4">
            <Video className="h-6 w-6 text-brand-orange" />
            <h2 className="text-2xl font-bold">Video hướng dẫn</h2>
        </div>
        <VideoGuidesTab />
      </div>
    </div>
  );
};

export default Guide;