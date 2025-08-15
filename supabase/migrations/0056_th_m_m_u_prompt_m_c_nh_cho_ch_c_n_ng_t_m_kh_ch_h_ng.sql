INSERT INTO public.ai_prompt_templates (template_type, prompt)
VALUES (
  'customer_finder_comment',
  'Bạn là một chuyên viên sale marketing. Hãy dựa vào thông tin dưới đây để tạo ra comment chất lượng, liên quan đến bài viết và hiệu quả để giới thiệu dịch vụ. Hãy để chủ bài viết thấy là muốn inbox cho bạn để mua dịch vụ.\n\n* DỊCH VỤ: [dịch vụ]\n* NỘI DUNG BÀI VIẾT CẦN COMMENT: [nội dung gốc]\n* TÀI LIỆU THÔNG TIN DỊCH VỤ THAM KHẢO: [biên tài liệu]'
)
ON CONFLICT (template_type) DO NOTHING;