import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Guide = () => {
  const guides = [
    {
      title: "1. Tìm kiếm khách hàng: Trợ lý săn tìm cơ hội 24/7",
      description: "Thay vì tốn hàng giờ lướt Facebook, công cụ này sẽ tự động tìm kiếm và mang những khách hàng tiềm năng nhất đến cho bạn.",
      steps: [
        "<strong>Bước 1: Thiết lập 'radar' của bạn (Tạo chiến dịch):</strong> Hãy coi mỗi chiến dịch như một 'radar' chuyên biệt. Bạn vào menu <strong>Quét & Tìm khách hàng</strong> và tạo một chiến dịch mới.",
        "<strong>Bước 2: Nhập 'tín hiệu' (Điền thông tin):</strong> Đặt tên cho chiến dịch, chọn các group Facebook bạn muốn quét và nhập các từ khóa liên quan. Đây là những 'tín hiệu' mà radar của bạn sẽ dò tìm (ví dụ: 'cần thiết kế logo', 'tìm đơn vị marketing').",
        "<strong>Bước 3: Tối ưu hóa (Thiết lập quét & AI):</strong> Bật <strong>'Bộ lọc AI'</strong> giống như việc trang bị cho radar của bạn một bộ não thông minh. AI sẽ tự động phân tích và đánh giá mức độ tiềm năng của mỗi bài viết, giúp bạn tiết kiệm thời gian.",
        "<strong>Bước 4: Xem 'chiến lợi phẩm' (Xem kết quả):</strong> Vào mục <strong>Tìm khách hàng</strong>, tất cả các 'mục tiêu' tiềm năng sẽ được liệt kê rõ ràng, kèm theo đánh giá từ AI.",
        "<strong>Bước 5: Tiếp cận thông minh (Hành động):</strong> Không cần phải suy nghĩ nên bắt đầu từ đâu. AI đã gợi ý sẵn một bình luận chuyên nghiệp. Bạn chỉ cần sao chép, chỉnh sửa một chút cho phù hợp và tương tác với khách hàng."
      ]
    },
    {
      title: "2. Tạo bài viết: Nhà sáng tạo nội dung cá nhân của bạn",
      description: "Hết ý tưởng viết bài? Công cụ này sẽ là nguồn cảm hứng vô tận, giúp bạn tạo ra những bài viết chất lượng để quảng bá dịch vụ trên trang cá nhân hoặc các hội nhóm chỉ trong vài giây.",
      steps: [
        "<strong>Bước 1: Xác định mục tiêu:</strong> Truy cập <strong>Tạo Content &gt; Tạo bài viết</strong>. Bạn muốn viết bài để quảng cáo, chia sẻ kiến thức hay giới thiệu dịch vụ? Hãy chọn đúng 'Dạng bài' và 'Dịch vụ' bạn muốn nói đến.",
        "<strong>Bước 2: Cung cấp 'linh hồn' cho bài viết:</strong> Trong ô 'Định hướng', hãy cho AI biết bạn muốn bài viết có phong cách như thế nào. Ví dụ: 'viết một cách hài hước', 'nhấn mạnh vào giá cả phải chăng cho doanh nghiệp nhỏ'.",
        "<strong>Bước 3: Nhận thành quả và tỏa sáng:</strong> Nhấn 'Tạo bài viết'. AI sẽ trả về một bài viết hoàn chỉnh. Việc của bạn chỉ là đọc lại, thêm một chút 'chất' riêng của mình và đăng tải để thu hút khách hàng."
      ]
    },
    {
      title: "3. Tạo bình luận: Chuyên gia tương tác tức thì",
      description: "Biến mọi bình luận thành cơ hội. Công cụ này giúp bạn tạo ra những phản hồi thông minh, tự nhiên và đầy tính thuyết phục khi tương tác với các bài viết của khách hàng.",
      steps: [
        "<strong>Bước 1: Cung cấp bối cảnh:</strong> Vào <strong>Tạo Content &gt; Tạo comment</strong>. Dán nội dung bài viết của khách hàng vào đây để AI hiểu rõ họ đang cần gì.",
        "<strong>Bước 2: Đưa ra giải pháp:</strong> Chọn dịch vụ phù hợp nhất của Dailong Media có thể giải quyết vấn đề của khách hàng.",
        "<strong>Bước 3: Tạo bình luận 'chốt đơn':</strong> Nhấn 'Tạo Comment'. AI sẽ tạo ra một bình luận vừa thể hiện sự đồng cảm, vừa khéo léo giới thiệu giải pháp của chúng ta. Bạn chỉ cần sao chép và bắt đầu cuộc trò chuyện."
      ]
    },
    {
      title: "4. Tư vấn khách hàng: Chuyên gia AI luôn kề vai sát cánh",
      description: "Bạn không còn đơn độc khi đối mặt với những câu hỏi khó từ khách hàng. Trợ lý AI này được trang bị đầy đủ kiến thức về dịch vụ của Dailong Media để hỗ trợ bạn 24/7.",
      steps: [
        "<strong>Bước 1: Mở một cuộc trò chuyện mới:</strong> Vào <strong>Tư vấn khách hàng</strong>. Mỗi khách hàng là một câu chuyện, hãy tạo một phiên tư vấn riêng để AI có thể tập trung hỗ trợ bạn tốt nhất.",
        "<strong>Bước 2: 'Hỏi' chuyên gia:</strong> Chỉ cần dán tin nhắn của khách hàng vào khung chat và bấm gửi. AI sẽ tự động phân tích và soạn thảo câu trả lời.",
        "<strong>Bước 3: Nhận tư vấn chuyên nghiệp:</strong> AI sẽ cung cấp câu trả lời chi tiết, từ quy trình làm việc, báo giá cho đến các lợi ích của dịch vụ. Bạn chỉ cần sao chép, chỉnh sửa nếu cần và gửi cho khách hàng."
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hướng dẫn sử dụng hệ thống</h1>
        <p className="text-muted-foreground mt-2">
          Chào mừng bạn đến với hệ thống Cộng tác viên của Dailong Media! Đây là không gian làm việc được thiết kế dành riêng cho bạn, tích hợp những công cụ mạnh mẽ để giúp bạn tìm kiếm khách hàng, sáng tạo nội dung và quản lý thu nhập một cách hiệu quả nhất. Hãy cùng khám phá các tính năng chính nhé!
        </p>
      </div>

      <div className="grid gap-6">
        {guides.map((guide, index) => (
          <Card key={index} className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">{guide.title}</CardTitle>
              <CardDescription className="text-base">{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-4">
                {guide.steps.map((step, stepIndex) => (
                  <li key={stepIndex} dangerouslySetInnerHTML={{ __html: step }} className="text-gray-700 leading-relaxed" />
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Guide;