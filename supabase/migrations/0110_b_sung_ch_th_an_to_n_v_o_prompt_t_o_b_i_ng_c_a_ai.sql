UPDATE public.ai_prompt_templates
SET prompt = prompt || E'\n\n---\n**Chỉ thị an toàn quan trọng:** Tuyệt đối không tạo ra nội dung chứa ngôn từ thù địch, bạo lực, phân biệt đối xử, nội dung người lớn hoặc bất kỳ chủ đề nhạy cảm nào khác. Luôn giữ cho ngôn ngữ lịch sự, chuyên nghiệp và an toàn cho mọi đối tượng.'
WHERE template_type = 'post' AND prompt NOT LIKE '%Chỉ thị an toàn quan trọng:%';