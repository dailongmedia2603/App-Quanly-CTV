import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Briefcase, FileText, Factory, Compass, Wand2, Sparkles, RefreshCw, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CreatePost = () => {
  // Form state
  const [service, setService] = useState('');
  const [postType, setPostType] = useState('');
  const [industry, setIndustry] = useState('');
  const [direction, setDirection] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');

  // Regeneration state
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateDirection, setRegenerateDirection] = useState('');

  const handleGeneratePost = async (isRegeneration = false) => {
    if (!service || !postType || !industry) {
      showError("Vui lòng điền đầy đủ các trường Dịch vụ, Dạng bài và Ngành.");
      return;
    }
    setIsGenerating(true);
    if (isRegeneration) setIsRegenerateDialogOpen(false);
    const toastId = showLoading(isRegeneration ? "Đang tạo lại bài viết..." : "AI đang sáng tạo, vui lòng chờ...");

    const { data, error } = await supabase.functions.invoke('generate-post', {
      body: {
        service,
        postType,
        industry,
        direction,
        ...(isRegeneration && { originalPost: generatedPost, regenerateDirection })
      }
    });

    dismissToast(toastId);
    if (error) {
      showError(`Tạo bài viết thất bại: ${error.message}`);
    } else {
      showSuccess("Tạo bài viết thành công!");
      setGeneratedPost(data.post);
      setRegenerateDirection('');
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost).then(() => {
      showSuccess("Đã sao chép nội dung!");
    }).catch(err => {
      showError("Không thể sao chép.");
    });
  };

  const FormInput = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2 text-gray-600">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tạo bài viết</h1>
        <p className="text-gray-500 mt-1">Sử dụng AI để tạo ra các bài viết hấp dẫn.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Configuration */}
        <Card className="lg:col-span-1 border-orange-200 sticky top-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-6 w-6 text-brand-orange" />
              <span>Cấu hình</span>
            </CardTitle>
            <CardDescription>Nhập thông tin để AI tạo bài viết.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormInput icon={Briefcase} label="Dịch vụ">
              <Input placeholder="VD: Thiết kế website" value={service} onChange={e => setService(e.target.value)} />
            </FormInput>
            <FormInput icon={FileText} label="Dạng bài">
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger><SelectValue placeholder="Chọn dạng bài" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Giới thiệu dịch vụ">Giới thiệu dịch vụ</SelectItem>
                  <SelectItem value="Chia sẻ kiến thức kèm PR">Chia sẻ kiến thức kèm PR</SelectItem>
                  <SelectItem value="Kể chuyện">Kể chuyện</SelectItem>
                  <SelectItem value="Khuyến mãi">Khuyến mãi</SelectItem>
                </SelectContent>
              </Select>
            </FormInput>
            <FormInput icon={Factory} label="Ngành muốn đánh">
              <Input placeholder="VD: F&B, Mỹ phẩm" value={industry} onChange={e => setIndustry(e.target.value)} />
            </FormInput>
            <FormInput icon={Compass} label="Định hướng bài viết (nếu có)">
              <Textarea placeholder="VD: Nhấn mạnh vào tốc độ, giá cả phải chăng..." value={direction} onChange={e => setDirection(e.target.value)} />
            </FormInput>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={() => handleGeneratePost(false)} disabled={isGenerating}>
              <Wand2 className="mr-2 h-4 w-4" />
              {isGenerating ? 'Đang tạo...' : 'Tạo bài viết'}
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column: Content */}
        <Card className="lg:col-span-2 border-orange-200 min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-brand-orange" />
                <span>Nội dung tạo ra</span>
              </CardTitle>
              <CardDescription>Đây là bài viết do AI tạo ra dựa trên cấu hình của bạn.</CardDescription>
            </div>
            {generatedPost && !isGenerating && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4 mr-2" />Sao chép</Button>
                <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><RefreshCw className="h-4 w-4 mr-2" />Tạo lại</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo lại bài viết</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="regenerate-direction">Định hướng mới (nếu có)</Label>
                      <Textarea id="regenerate-direction" placeholder="VD: Viết ngắn gọn hơn, thêm yếu tố hài hước..." value={regenerateDirection} onChange={e => setRegenerateDirection(e.target.value)} className="mt-2" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(false)}>Hủy</Button>
                      <Button onClick={() => handleGeneratePost(true)}>Tạo lại</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : generatedPost ? (
              <div className="prose max-w-none whitespace-pre-wrap">{generatedPost}</div>
            ) : (
              <div className="text-center text-gray-500 py-20">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-medium">Nội dung của bạn sẽ xuất hiện ở đây</p>
                <p className="text-sm">Hãy điền thông tin và bấm "Tạo bài viết" để bắt đầu.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;