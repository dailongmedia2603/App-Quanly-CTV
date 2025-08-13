import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';

interface PromptTemplateEditorProps {
  templateType: 'post' | 'comment' | 'consulting';
  title: string;
  description: string;
}

const variableConfig = {
  post: [
    { name: 'Dịch vụ', value: '[dịch vụ]' },
    { name: 'Dạng bài', value: '[dạng bài]' },
    { name: 'Ngành', value: '[ngành]' },
    { name: 'Định hướng', value: '[định hướng]' },
    { name: 'Biên tài liệu', value: '[biên tài liệu]' },
  ],
  comment: [
    { name: 'Dịch vụ', value: '[dịch vụ]' },
    { name: 'Nội dung gốc', value: '[nội dung gốc]' },
    { name: 'Cảm xúc', value: '[cảm xúc]' },
    { name: 'Mục tiêu comment', value: '[mục tiêu comment]' },
    { name: 'Biên tài liệu', value: '[biên tài liệu]' },
  ],
  consulting: [
    { name: 'Câu hỏi khách hàng', value: '[câu hỏi khách hàng]' },
    { name: 'Sản phẩm liên quan', value: '[sản phẩm liên quan]' },
    { name: 'Thông tin thêm', value: '[thông tin thêm]' },
    { name: 'Biên tài liệu', value: '[biên tài liệu]' },
  ],
};

const PromptTemplateEditor = ({ templateType, title, description }: PromptTemplateEditorProps) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const availableVariables = variableConfig[templateType];

  useEffect(() => {
    const fetchPrompt = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', templateType)
        .single();

      if (data) {
        setPrompt(data.prompt || '');
      } else if (error && error.code !== 'PGRST116') {
        showError(`Không thể tải mẫu prompt: ${error.message}`);
      }
      setLoading(false);
    };
    fetchPrompt();
  }, [templateType]);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading('Đang lưu...');
    const { error } = await supabase.from('ai_prompt_templates').upsert(
      {
        template_type: templateType,
        prompt: prompt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'template_type' }
    );
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess('Lưu mẫu prompt thành công!');
    }
    setIsSaving(false);
  };

  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + ` ${variable} ` + text.substring(end);

    setPrompt(newText);

    // Focus and set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length + 2;
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-600">Chèn biến</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableVariables.map((variable) => (
              <Button
                key={variable.name}
                variant="outline"
                size="sm"
                className="text-xs bg-white hover:bg-gray-50"
                onClick={() => handleInsertVariable(variable.value)}
              >
                {variable.name}
              </Button>
            ))}
          </div>
        </div>
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập mẫu prompt của bạn ở đây..."
          className="min-h-[250px] text-base font-mono bg-gray-50"
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromptTemplateEditor;