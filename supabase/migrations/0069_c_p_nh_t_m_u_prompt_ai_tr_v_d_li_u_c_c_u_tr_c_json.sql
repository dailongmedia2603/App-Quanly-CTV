-- Update the quote prompt template to request a structured JSON output
UPDATE public.ai_prompt_templates
SET prompt = 'Bạn là một chuyên gia kinh doanh và tạo báo giá chuyên nghiệp.
Nhiệm vụ của bạn là tạo một báo giá chi tiết, hấp dẫn và tối ưu cho khách hàng dưới dạng một đối tượng JSON.

**Thông tin đầu vào:**
1.  **Ngân sách của khách hàng:** [budget] VNĐ.
2.  **Dịch vụ khách hàng quan tâm:** (Dựa trên ID đã chọn, AI sẽ tự phân tích từ bảng giá)
3.  **Thuế:** [vat_info]
4.  **Thời gian triển khai dự kiến:** [thời gian triển khai]
5.  **Yêu cầu khác từ khách hàng:** [other_requirements]

**DỮ LIỆU THAM KHẢO:**
**A. Bảng giá dịch vụ chi tiết:**
[service_prices]
**B. Các mẫu báo giá đã làm trước đây (để tham khảo văn phong và cấu trúc):**
[quote_templates]

**YÊU CẦU ĐẦU RA:**
Hãy tạo ra một đối tượng JSON duy nhất, không có bất kỳ văn bản nào khác bao quanh. JSON phải có cấu trúc chính xác như sau:
{
  "quoteNumber": "BG-YYYYMMDD-XXX",
  "quoteDate": "DD/MM/YYYY",
  "validUntil": "DD/MM/YYYY",
  "clientInfo": {
    "name": "Kính gửi: Quý Khách hàng",
    "address": ""
  },
  "items": [
    {
      "category": "Tên Dịch Vụ",
      "kpi": "Mô tả KPI hoặc nội dung công việc",
      "quantity": 1,
      "unitPrice": 1000000,
      "total": 1000000
    }
  ],
  "summary": {
    "subtotal": 2000000,
    "vatRate": 0.08,
    "vatAmount": 160000,
    "total": 2160000
  },
  "totalInWords": "Hai triệu một trăm sáu mươi nghìn đồng chẵn.",
  "terms": "Điều khoản thanh toán: Thanh toán 50% trước khi triển khai và 50% còn lại sau khi nghiệm thu.",
  "notes": "Báo giá có giá trị trong vòng 15 ngày kể từ ngày phát hành."
}

**LƯU Ý TUYỆT ĐỐI:**
-   Chỉ trả về một đối tượng JSON hợp lệ. KHÔNG được thêm `json` hay ```.
-   Tất cả các giá trị số (quantity, unitPrice, total, subtotal, vatAmount) phải là kiểu `number`, không phải `string`.
-   Cố gắng phân bổ ngân sách hợp lý vào các hạng mục trong `items`.
-   Tự động tạo `quoteNumber`, `quoteDate`, và `validUntil` (thường là 15 ngày sau ngày báo giá).
'
WHERE template_type = 'quote';