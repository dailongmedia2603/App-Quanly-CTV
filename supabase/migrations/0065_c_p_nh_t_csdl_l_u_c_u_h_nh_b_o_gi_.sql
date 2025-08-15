-- Add columns for quote configuration to app_settings
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS quote_company_name TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS quote_company_address TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS quote_company_email TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS quote_company_phone TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS quote_logo_url TEXT;

-- Set default values for the new columns for the existing row
UPDATE public.app_settings
SET
  quote_company_name = 'Công ty TNHH Listen PRO',
  quote_company_address = 'Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM',
  quote_company_email = 'contact@listenpro.vn',
  quote_company_phone = '0123 456 789',
  quote_logo_url = '/logolistenpro.png'
WHERE id = 1;

-- Create a public bucket for quote assets like logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote_assets', 'quote_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Insert a default prompt template for quote generation
INSERT INTO public.ai_prompt_templates (template_type, prompt)
VALUES (
  'quote',
  'Bạn là một chuyên gia kinh doanh và tạo báo giá chuyên nghiệp.
Nhiệm vụ của bạn là tạo một báo giá chi tiết, hấp dẫn và tối ưu cho khách hàng dựa trên các thông tin sau:

1.  **Ngân sách của khách hàng:** [budget] VNĐ. Cố gắng tạo báo giá có tổng tiền gần với ngân sách này nhất có thể, có thể cao hơn hoặc thấp hơn một chút nhưng không quá 10%.
2.  **Dịch vụ khách hàng quan tâm:** (Dựa trên ID đã chọn, AI sẽ tự phân tích từ bảng giá)
3.  **Thuế:** [vat_info]
4.  **Yêu cầu khác từ khách hàng:** [other_requirements]

**DỮ LIỆU THAM KHẢO:**

**A. Bảng giá dịch vụ chi tiết:**
[service_prices]

**B. Các mẫu báo giá đã làm trước đây (để tham khảo văn phong và cấu trúc):**
[quote_templates]

**YÊU CẦU ĐẦU RA:**
Hãy tạo ra một báo giá hoàn chỉnh bằng định dạng Markdown. Báo giá phải bao gồm các phần sau:
-   Tiêu đề: "BÁO GIÁ DỊCH VỤ"
-   Thông tin cơ bản: Ngày báo giá, Mã báo giá (tự tạo).
-   Bảng chi tiết các hạng mục dịch vụ. Bảng này PHẢI có các cột: "Hạng mục", "Mô tả chi tiết", "Số lượng", "Đơn vị", "Đơn giá (VNĐ)", "Thành tiền (VNĐ)".
-   Phần tổng kết chi phí:
    -   Cộng dịch vụ (VNĐ)
    -   Thuế VAT (10% nếu có)
    -   **TỔNG CỘNG (VNĐ)**
-   Ghi chú (nếu cần).

**QUAN TRỌNG:**
-   Hãy lựa chọn các dịch vụ và số lượng phù hợp nhất từ Bảng giá để tối ưu trong ngân sách khách hàng đưa ra.
-   Phần "Mô tả chi tiết" phải giải thích rõ ràng giá trị và lợi ích của từng hạng mục.
-   Tất cả các con số phải được định dạng có dấu chấm ngăn cách hàng nghìn (ví dụ: 1.000.000).
-   Giữ văn phong chuyên nghiệp, thuyết phục.'
)
ON CONFLICT (template_type) DO NOTHING;