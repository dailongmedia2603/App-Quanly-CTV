import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DocumentationTab = () => {
  const guides = [
    {
      title: "1. Tìm kiếm khách hàng: Trợ lý săn tìm cơ hội 24/7",
      description: "<strong>Ý nghĩa:</strong> Thay vì tốn hàng giờ lướt Facebook, công cụ này sẽ tự động tìm kiếm và mang những khách hàng tiềm năng nhất đến cho bạn. Hệ thống sẽ 'lắng nghe' các hội nhóm và đề xuất những người đang thực sự có nhu cầu về dịch vụ của Dailong Media, giúp bạn tập trung vào việc quan trọng nhất: kết nối và tư vấn.",
      steps: [
        "<strong>Hướng dẫn & Giải thích các mục:</strong>",
        "<strong>Nội dung bài viết:</strong> Đây là nội dung gốc mà khách hàng đã đăng. Hãy đọc kỹ để nắm bắt chính xác 'nỗi đau' và nhu cầu của họ.",
        "<strong>Comment đề xuất:</strong> AI đã phân tích và soạn sẵn một bình luận chuyên nghiệp. <strong>Việc của bạn:</strong> Nhấn nút 'Tạo comment', sao chép, có thể chỉnh sửa một chút cho tự nhiên hơn, sau đó đăng vào bài viết của khách hàng để bắt đầu cuộc trò chuyện.",
        "<strong>Thời gian đăng:</strong> Cho bạn biết bài viết được đăng khi nào. Những bài viết mới nhất thường là cơ hội tốt nhất, hãy ưu tiên tương tác trước.",
        "<strong>Dịch vụ phù hợp:</strong> Hệ thống tự động phân tích và gợi ý dịch vụ phù hợp nhất, giúp bạn tư vấn đúng trọng tâm.",
        "<strong>Link:</strong> Đường dẫn trực tiếp đến bài viết gốc. Nhấn vào đây để đến thẳng bài viết và bắt đầu tương tác."
      ]
    },
    {
      title: "2. Tạo bài viết: Nhà sáng tạo nội dung cá nhân của bạn",
      description: "<strong>Ý nghĩa:</strong> Bạn không phải là một người viết nội dung chuyên nghiệp? Không sao cả. Công cụ này là trợ lý sáng tạo cá nhân của bạn, giúp vượt qua 'bí ý tưởng' và tạo ra những bài viết chất lượng để quảng bá dịch vụ trên trang cá nhân hoặc các hội nhóm chỉ trong vài giây.",
      steps: [
        "<strong>Hướng dẫn & Giải thích các mục:</strong>",
        "<strong>Dịch vụ:</strong> Chọn dịch vụ bạn muốn quảng bá. Điều này giúp AI tập trung vào đúng chủ đề và thông tin.",
        "<strong>Dạng bài:</strong> Xác định mục tiêu của bài viết (quảng cáo, chia sẻ kiến thức, giới thiệu...). Điều này quyết định cấu trúc và giọng văn của AI.",
        "<strong>Ngành muốn đánh:</strong> Cung cấp thông tin về ngành nghề của khách hàng mục tiêu (ví dụ: F&B, Thời trang) để AI sử dụng ngôn từ và ví dụ phù hợp.",
        "<strong>Định hướng bài viết:</strong> Đây là phần quan trọng nhất để tạo 'chất' riêng. Hãy cho AI biết phong cách bạn muốn (ví dụ: 'viết hài hước', 'nhấn mạnh giá cả phải chăng', 'so sánh với đối thủ').",
        "<strong>Kết quả:</strong> AI sẽ trả về một bài viết hoàn chỉnh. Việc của bạn chỉ là đọc lại, thêm thắt một chút cá tính của mình và đăng tải để thu hút khách hàng."
      ]
    },
    {
      title: "3. Tạo bình luận: Chuyên gia tương tác tức thì",
      description: "<strong>Ý nghĩa:</strong> Biến mọi tương tác trên mạng xã hội thành cơ hội kinh doanh. Khi bạn thấy một bài viết tiềm năng, công cụ này sẽ giúp bạn tạo ra những phản hồi thông minh, tự nhiên và đầy tính thuyết phục, khéo léo giới thiệu dịch vụ của Dailong Media.",
      steps: [
        "<strong>Hướng dẫn & Giải thích các mục:</strong>",
        "<strong>Dịch vụ cần quảng bá:</strong> Chọn dịch vụ phù hợp nhất có thể giải quyết vấn đề của khách hàng.",
        "<strong>Nội dung bài viết gốc:</strong> Dán toàn bộ nội dung bài viết của khách hàng vào đây. Đây là 'bối cảnh' để AI hiểu họ đang cần gì và đưa ra bình luận liên quan nhất.",
        "<strong>Kết quả:</strong> AI sẽ tạo ra một bình luận vừa thể hiện sự đồng cảm, vừa là một lời giới thiệu giải pháp tinh tế. Bạn chỉ cần sao chép và bắt đầu cuộc trò chuyện."
      ]
    },
    {
      title: "4. Tư vấn khách hàng: Chuyên gia AI luôn kề vai sát cánh",
      description: "<strong>Ý nghĩa:</strong> Bạn không còn đơn độc khi đối mặt với những câu hỏi khó từ khách hàng. Trợ lý AI này được trang bị đầy đủ kiến thức về dịch vụ, quy trình và báo giá của Dailong Media để hỗ trợ bạn 24/7, đảm bảo mọi câu trả lời đều chuyên nghiệp và nhất quán.",
      steps: [
        "<strong>Hướng dẫn & Giải thích các mục:</strong>",
        "<strong>Tạo phiên tư vấn mới:</strong> Mỗi khách hàng nên có một phiên trò chuyện riêng. Điều này giúp AI ghi nhớ ngữ cảnh và đưa ra những câu trả lời ngày càng chính xác hơn.",
        "<strong>Chọn Dịch vụ:</strong> Lựa chọn các dịch vụ mà khách hàng đang quan tâm để AI tập trung vào đúng nguồn kiến thức.",
        "<strong>Khung chat:</strong> Dán tin nhắn hoặc câu hỏi của khách hàng vào đây và bấm gửi.",
        "<strong>Kết quả:</strong> AI sẽ phản hồi như một chuyên viên tư vấn thực thụ. Bạn có thể sao chép câu trả lời này, chỉnh sửa nếu cần, và gửi cho khách hàng, giúp tiết kiệm thời gian và tăng tính chuyên nghiệp."
      ]
    },
    {
      title: "5. Theo dõi thu nhập: Bảng điều khiển tài chính của bạn",
      description: "Mọi nỗ lực của bạn đều được ghi nhận. Tại đây, bạn có thể theo dõi thu nhập của mình một cách minh bạch, rõ ràng và cập nhật theo thời gian thực.",
      steps: [
        "<strong>Bước 1: Xem tổng quan:</strong> Truy cập menu <strong>Thu nhập</strong>. Bảng điều khiển sẽ cho bạn thấy bức tranh tài chính tổng thể trong tháng bạn chọn.",
        "<strong>Bước 2: Hiểu rõ các khoản thu nhập:</strong> Bạn sẽ thấy rõ từng khoản: Lương cứng, Hoa hồng từ hợp đồng mới, và cả hoa hồng từ các hợp đồng cũ.",
        "<strong>Bước 3: Xem chi tiết từng hợp đồng:</strong> Mọi hợp đồng bạn mang về đều được liệt kê chi tiết trong tab 'Hợp đồng', giúp bạn dễ dàng đối soát và nắm bắt hiệu quả công việc của mình."
      ]
    }
  ];

  return (
    <div className="grid gap-6">
      {guides.map((guide, index) => (
        <Card key={index} className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-gray-800" dangerouslySetInnerHTML={{ __html: guide.title }} />
            <CardDescription className="text-base" dangerouslySetInnerHTML={{ __html: guide.description }} />
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-4">
              {guide.steps.map((step, stepIndex) => (
                <li key={stepIndex} dangerouslySetInnerHTML={{ __html: step }} className="text-gray-700 leading-relaxed" />
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DocumentationTab;