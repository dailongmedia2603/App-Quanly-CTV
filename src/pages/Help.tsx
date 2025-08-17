import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HelpPage = () => {
  const guides = [
    {
      title: "1. Tìm kiếm khách hàng",
      description: "Công cụ tự động quét các hội nhóm Facebook để tìm kiếm khách hàng tiềm năng dựa trên các từ khóa và chiến dịch bạn thiết lập.",
      steps: [
        "<strong>Tạo chiến dịch:</strong> Truy cập menu <strong>Tìm khách hàng &gt; Danh sách chiến dịch</strong> và nhấn <strong>'Tạo chiến dịch mới'</strong>.",
        "<strong>Điền thông tin:</strong> Đặt tên, chọn nguồn (các group Facebook đã có), và nhập các <strong>từ khóa</strong> liên quan đến dịch vụ (ví dụ: 'cần thiết kế logo', 'tìm đơn vị marketing', 'báo giá website').",
        "<strong>Thiết lập quét:</strong> Chọn tần suất quét và thời gian bắt đầu/kết thúc. Nên bật <strong>'Bộ lọc AI'</strong> để hệ thống phân tích và đánh giá bài viết một cách thông minh, giúp bạn tập trung vào những khách hàng tiềm năng nhất.",
        "<strong>Xem kết quả:</strong> Vào mục <strong>Tìm khách hàng &gt; Báo cáo Facebook</strong>. Tại đây, hệ thống sẽ liệt kê tất cả bài viết phù hợp được tìm thấy.",
        "<strong>Hành động:</strong> Bạn có thể xem nội dung bài viết, đánh giá của AI về mức độ tiềm năng, và sử dụng <strong>'Bình luận gợi ý'</strong> do AI tạo ra để tương tác nhanh chóng và chuyên nghiệp."
      ]
    },
    {
      title: "2. Tạo bài viết (AI Content)",
      description: "Sử dụng trí tuệ nhân tạo (AI) để nhanh chóng soạn thảo các bài viết quảng cáo, chia sẻ kiến thức chuyên nghiệp để đăng lên trang cá nhân hoặc các hội nhóm.",
      steps: [
        "Truy cập menu <strong>Công cụ AI &gt; Tạo bài viết</strong>.",
        "<strong>Chọn Dịch vụ:</strong> Lựa chọn dịch vụ bạn muốn quảng bá (ví dụ: Thiết kế Website, Quản trị Fanpage).",
        "<strong>Chọn Loại bài viết:</strong> Xác định mục tiêu của bài viết (ví dụ: Bài viết quảng cáo, Bài viết chia sẻ kiến thức, Bài viết giới thiệu).",
        "<strong>Thêm yêu cầu:</strong> Cung cấp thêm các chỉ dẫn chi tiết cho AI để nội dung được cá nhân hóa và hiệu quả hơn (ví dụ: 'giọng văn hài hước, gần gũi', 'nhấn mạnh vào lợi ích tiết kiệm chi phí cho doanh nghiệp nhỏ').",
        "<strong>Tạo và sử dụng:</strong> Nhấn <strong>'Tạo bài viết'</strong>. AI sẽ tạo ra một bài viết hoàn chỉnh. Bạn có thể sao chép, chỉnh sửa lại một chút cho phù hợp với văn phong của mình và đăng tải."
      ]
    },
    {
      title: "3. Tạo bình luận (AI Comment)",
      description: "Công cụ giúp bạn tạo ra các bình luận chuyên nghiệp, phù hợp với ngữ cảnh để trả lời khách hàng hoặc tương tác trong các bài viết tiềm năng.",
      steps: [
        "Truy cập menu <strong>Công cụ AI &gt; Tạo comment</strong>.",
        "<strong>Dán nội dung bài viết:</strong> Sao chép toàn bộ nội dung bài viết của khách hàng mà bạn muốn bình luận và dán vào ô.",
        "<strong>Chọn Dịch vụ:</strong> Chọn dịch vụ của Dailong Media phù hợp nhất để giải quyết nhu cầu trong bài viết.",
        "<strong>Thêm yêu cầu (tùy chọn):</strong> Đưa ra chỉ dẫn thêm cho AI (ví dụ: 'bình luận ngắn gọn và thân thiện', 'thể hiện sự chuyên nghiệp và đồng cảm').",
        "<strong>Tạo và sử dụng:</strong> Nhấn <strong>'Tạo comment'</strong>. AI sẽ phân tích bài viết và tạo ra một bình luận gợi ý. Bạn có thể sao chép để sử dụng trực tiếp hoặc chỉnh sửa lại."
      ]
    },
    {
      title: "4. Tư vấn khách hàng (AI Assistant)",
      description: "Trợ lý AI chuyên nghiệp được huấn luyện để giúp bạn soạn thảo nội dung tư vấn, báo giá, và trả lời các câu hỏi phức tạp của khách hàng.",
      steps: [
        "Truy cập menu <strong>Công cụ AI &gt; Tư vấn khách hàng</strong>.",
        "<strong>Tạo phiên tư vấn mới:</strong> Mỗi khách hàng hoặc mỗi cuộc trò chuyện nên được bắt đầu trong một phiên mới để AI có thể theo dõi ngữ cảnh tốt hơn.",
        "<strong>Chọn Dịch vụ:</strong> Chọn các dịch vụ mà khách hàng đang quan tâm.",
        "<strong>Bắt đầu trò chuyện với AI:</strong> Đặt câu hỏi hoặc nhập yêu cầu của khách hàng vào khung chat. Ví dụ: 'Khách hàng hỏi về quy trình thiết kế logo gồm mấy bước?', 'Soạn giúp mình một báo giá chi tiết cho dịch vụ quản trị fanpage gói cơ bản trong 3 tháng'.",
        "<strong>Nhận câu trả lời:</strong> AI sẽ phản hồi như một chuyên viên tư vấn thực thụ. Bạn có thể sao chép câu trả lời này để gửi cho khách hàng, giúp tiết kiệm thời gian và đảm bảo tính chuyên nghiệp."
      ]
    },
    {
      title: "5. Theo dõi thu nhập",
      description: "Theo dõi toàn bộ thu nhập, hoa hồng, và hiệu suất kinh doanh của bạn một cách minh bạch và chi tiết.",
      steps: [
        "Truy cập menu <strong>Báo cáo hiệu suất &gt; Thu nhập của tôi</strong>.",
        "<strong>Chọn tháng báo cáo:</strong> Sử dụng bộ lọc để chọn tháng bạn muốn xem chi tiết.",
        "<strong>Xem tổng quan:</strong> Bảng điều khiển sẽ hiển thị các thông số quan trọng:",
        "<ul><li><strong>Lương cứng:</strong> Khoản lương cố định bạn nhận được dựa trên doanh số đạt được trong tháng hoặc tháng trước đó.</li><li><strong>Hoa hồng hợp đồng mới:</strong> Tổng hoa hồng từ các hợp đồng được ký kết trong tháng.</li><li><strong>Hoa hồng hợp đồng cũ:</strong> Tổng hoa hồng từ các khoản thanh toán của những hợp đồng đã ký từ các tháng trước.</li><li><strong>Tổng thu nhập:</strong> Tổng của tất cả các khoản trên.</li></ul>",
        "<strong>Xem chi tiết hợp đồng:</strong> Kéo xuống dưới để xem danh sách chi tiết từng hợp đồng, giá trị, và các khoản thanh toán liên quan đã được ghi nhận trong tháng."
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hướng dẫn sử dụng hệ thống</h1>
        <p className="text-muted-foreground mt-2">
          Chào mừng bạn đến với hệ thống Cộng tác viên của Dailong Media. Dưới đây là hướng dẫn chi tiết các tính năng chính giúp bạn làm việc hiệu quả.
        </p>
      </div>

      <div className="grid gap-6">
        {guides.map((guide, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-2xl">{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3">
                {guide.steps.map((step, stepIndex) => (
                  <li key={stepIndex} dangerouslySetInnerHTML={{ __html: step }} className="text-gray-700" />
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HelpPage;