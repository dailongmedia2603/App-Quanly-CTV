import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { MessageSquare, Wand2, Sparkles, Copy, History, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';

const FormInput = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="flex items-center space-x-2 text-gray-600">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Label>
    {children}
  </div>
);

const CreateComment = () => {
  const navigate = useNavigate();
  const [originalPostContent, setOriginalPostContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComment, setGeneratedComment] = useState('');

  const handleGenerateComment = async () => {
    if (!originalPostContent.trim()) {
      showError("Vui lòng nhập nội dung bài viết gốc.");
      return;
    }
    setIsGenerating(true);
    setGeneratedComment(''); // Clear previous comment
    const toastId = showLoading("AI đang nghĩ comment hay...");

    const { data, error } = await supabase.functions.invoke('generate-comment', {
      body: {
        originalPostContent: originalPostContent,
      }
    });

    dismissToast(toastId);
    if (error) {
      showError(`Tạo comment thất bại: ${error.message}`);
    } else {
      showSuccess("Tạo comment thành công!");
      setGeneratedComment(data.comment);
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (!generatedComment) return;
    navigator.clipboard.writeText(generatedComment).then(() => {
      showSuccess("Đã sao chép comment!");
    }).catch(err => {
      showError("Không thể sao chép.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tạo Comment</h1>
          <p className="text-gray-500 mt-1">Sử dụng AI để tạo các bình luận quảng bá dịch vụ một cách tự nhiên.</p>
        </div>
        <Button onClick={() => navigate('/create-content/comment-history')} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            <History className="mr-2 h-4 w-4" />
            Comment đã tạo
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1 border-orange-200 sticky top-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-6 w-6 text-brand-orange" />
              <span>Cấu hình</span>
            </CardTitle>
            <CardDescription>Nhập nội dung bài viết để AI phân tích và tạo bình luận.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormInput icon={MessageSquare} label="Nội dung bài viết gốc">
              <Textarea 
                placeholder="Dán nội dung bài viết bạn muốn bình luận vào đây..." 
                value={originalPostContent} 
                onChange={e => setOriginalPostContent(e.target.value)}
                className="min-h-[250px]"
              />
            </FormInput>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleGenerateComment} disabled={isGenerating}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? 'Đang tạo...' : 'Tạo Comment'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 border-orange-200 min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-brand-orange" />
                <span>Comment được tạo ra</span>
              </CardTitle>
              <CardDescription>Đây là bình luận do AI tạo ra.</CardDescription>
            </div>
            {generatedComment && !isGenerating && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4 mr-2" />Sao chép</Button>
                <Button size="sm" variant="outline" className="bg-brand-orange-light text-brand-orange border-brand-orange hover:bg-orange-200 hover:text-brand-orange" onClick={handleGenerateComment}>
                    <RefreshCw className="h-4 w-4 mr-2" />Tạo lại
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-20">
                <Sparkles className="h-12 w-12 text-brand-orange animate-pulse" />
                <p className="mt-4 font-semibold text-gray-700">AI đang nghĩ comment hay...</p>
              </div>
            ) : generatedComment ? (
              <div className="prose max-w-none bg-gray-50 p-4 rounded-md border">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedComment}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-20">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-medium">Comment của bạn sẽ xuất hiện ở đây</p>
                <p className="text-sm">Hãy nhập nội dung bài viết và bấm "Tạo Comment".</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateComment;