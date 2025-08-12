import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

interface PromptTemplateEditorProps {
  templateType: 'post' | 'comment' | 'consulting';
  title: string;
  description: string;
}

const PromptTemplateEditor = ({ templateType, title, description }: PromptTemplateEditorProps) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      <CardContent>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập mẫu prompt của bạn ở đây..."
          className="min-h-[250px] text-base"
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