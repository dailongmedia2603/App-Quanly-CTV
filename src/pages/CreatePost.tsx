import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Briefcase, FileText, Factory, Compass, Wand2, Sparkles, RefreshCw, Copy, History, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Moved FormInput outside of CreatePost to prevent re-rendering on state change
const FormInput = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="flex items-center space-x-2 text-gray-600">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Label>
    {children}
  </div>
);

interface Log {
  id: string;
  created_at: string;
  generated_content: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
}

interface PostType {
  id: string;
  name: string;
  description: string | null;
  word_count: number | null;
}

const cleanAiResponseForDisplay = (rawText: string): string => {
  if (!rawText) return '';
  let text = rawText.trim();

  const contentMarker = "**[NỘI DUNG BÀI ĐĂNG]**";
  const markerIndex = text.indexOf(contentMarker);

  if (markerIndex !== -1) {
    text = text.substring(markerIndex + contentMarker.length).trim();
  } else {
    const lines = text.split('\n');
    let firstContentLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine === '') continue;
      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('*')) {
        firstContentLineIndex = i;
        break;
      }
      const isPreamble = /^(chắc chắn rồi|dưới đây là|here is|tuyệt vời|tất nhiên|here's a draft|here's the post)/i.test(trimmedLine);
      if (!isPreamble) {
        firstContentLineIndex = i;
        break;
      }
    }
    if (firstContentLineIndex !== -1) {
      text = lines.slice(firstContentLineIndex).join('\n').trim();
    }
  }

  text = text.replace(/^```(markdown|md|)\s*\n/i, '');
  text = text.replace(/\n\s*```$/, '');

  return text;
};

const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/#+\s/g, '') // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
    .replace(/~~(.*?)~~/g, '$1'); // Strikethrough
};

const getPostTitle = (content: string): string => {
  if (!content) return 'Bài viết không có nội dung';
  const cleanedContent = cleanAiResponseForDisplay(content);
  const firstLine = cleanedContent.split('\n')[0].trim();
  const cleanTitle = firstLine.replace(/^(#+\s*|\*\*\s*|\s*\*)/, '').replace(/\s*\*\*$/, '').trim();
  return cleanTitle || 'Bài viết không có tiêu đề';
};

const PostHistoryView = ({ onBack }: { onBack: () => void }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_generation_logs')
        .select('id, created_at, generated_content')
        .eq('template_type', 'post')
        .order('created_at', { ascending: false });

      if (error) {
        showError("Không thể tải lịch sử bài viết.");
        console.error(error);
      } else {
        setLogs(data as Log[]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const handleCopy = (content: string) => {
    const cleanedContent = cleanAiResponseForDisplay(content);
    const plainText = stripMarkdown(cleanedContent);
    navigator.clipboard.writeText(plainText).then(() => {
      showSuccess("Đã sao chép nội dung!");
    }).catch(err => {
      showError("Không thể sao chép.");
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold">Bài viết đã tạo</h1>
            <p className="text-gray-500 mt-1">Xem lại các bài viết bạn đã tạo trước đây.</p>
        </div>
        <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
        </Button>
      </div>
      <Card className="border-orange-200">
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Đang tải lịch sử...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 font-medium">Chưa có bài viết nào được tạo</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {logs.map(log => (
                <AccordionItem value={log.id} key={log.id} className="bg-white border border-orange-200 rounded-lg shadow-sm">
                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                    <div className="flex justify-between items-center w-full min-w-0 gap-4">
                      <span className="font-semibold text-left text-gray-800 truncate">{getPostTitle(log.generated_content)}</span>
                      <span className="text-sm text-gray-500 font-normal flex-shrink-0">
                        {format(new Date(log.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-white rounded-b-lg">
                    <div className="prose max-w-none relative bg-orange-50/30 p-4 rounded-md border border-orange-100">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 text-gray-600 hover:bg-orange-100"
                        onClick={() => handleCopy(log.generated_content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {cleanAiResponseForDisplay(log.generated_content)}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CreatePost = () => {
  const [view, setView] = useState<'create' | 'history'>('create');
  // Form state
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [loadingPostTypes, setLoadingPostTypes] = useState(true);
  const [selectedPostTypeId, setSelectedPostTypeId] = useState('');

  const [industry, setIndustry] = useState('');
  const [direction, setDirection] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');

  // Regeneration state
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateDirection, setRegenerateDirection] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from('document_services')
        .select('id, name, description')
        .order('name', { ascending: true });
      
      if (error) {
        showError("Không thể tải danh sách dịch vụ.");
      } else {
        setServices(data as Service[]);
      }
      setLoadingServices(false);
    };

    const fetchPostTypes = async () => {
      setLoadingPostTypes(true);
      const { data, error } = await supabase
        .from('document_post_types')
        .select('id, name, description, word_count')
        .order('name', { ascending: true });
      
      if (error) {
        showError("Không thể tải danh sách dạng bài.");
      } else {
        setPostTypes(data as PostType[]);
      }
      setLoadingPostTypes(false);
    };

    fetchServices();
    fetchPostTypes();
  }, []);

  const handleGeneratePost = async (isRegeneration = false) => {
    const selectedService = services.find(s => s.id === selectedServiceId);
    const selectedPostType = postTypes.find(pt => pt.id === selectedPostTypeId);

    if (!selectedService || !selectedPostType || !industry) {
      showError("Vui lòng điền đầy đủ các trường Dịch vụ, Dạng bài và Ngành.");
      return;
    }
    setIsGenerating(true);
    if (isRegeneration) setIsRegenerateDialogOpen(false);
    const toastId = showLoading(isRegeneration ? "Đang tạo lại bài viết..." : "AI đang sáng tạo, vui lòng chờ...");

    const serviceForPrompt = `${selectedService.name}${selectedService.description ? ` (Mô tả: ${selectedService.description})` : ''}`;
    const postTypeForPrompt = `${selectedPostType.name}${selectedPostType.description ? ` (Mô tả: ${selectedPostType.description})` : ''}`;

    const { data, error } = await supabase.functions.invoke('generate-post', {
      body: {
        service: serviceForPrompt,
        postType: postTypeForPrompt,
        wordCount: selectedPostType.word_count,
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
    const plainText = stripMarkdown(generatedPost);
    navigator.clipboard.writeText(plainText).then(() => {
      showSuccess("Đã sao chép nội dung!");
    }).catch(err => {
      showError("Không thể sao chép.");
    });
  };

  if (view === 'history') {
    return <PostHistoryView onBack={() => setView('create')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tạo bài viết</h1>
          <p className="text-gray-500 mt-1">Sử dụng AI để tạo ra các bài viết hấp dẫn.</p>
        </div>
        <Button onClick={() => setView('history')} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            <History className="mr-2 h-4 w-4" />
            Bài viết đã tạo
        </Button>
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
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {loadingServices ? (
                    <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                  ) : (
                    services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormInput>
            <FormInput icon={FileText} label="Dạng bài">
              <Select value={selectedPostTypeId} onValueChange={setSelectedPostTypeId}>
                <SelectTrigger><SelectValue placeholder="Chọn dạng bài" /></SelectTrigger>
                <SelectContent>
                  {loadingPostTypes ? (
                    <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                  ) : (
                    postTypes.map(postType => (
                      <SelectItem key={postType.id} value={postType.id}>
                        {postType.name}
                      </SelectItem>
                    ))
                  )}
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
                    <Button size="sm" variant="outline" className="bg-brand-orange-light text-brand-orange border-brand-orange hover:bg-orange-200 hover:text-brand-orange">
                        <RefreshCw className="h-4 w-4 mr-2" />Tạo lại
                    </Button>
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
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-20">
                <div className="relative flex items-center justify-center h-24 w-24">
                  <div className="absolute h-full w-full rounded-full bg-brand-orange-light animate-pulse-orange" style={{ animationDuration: '2s' }}></div>
                  <Sparkles className="h-12 w-12 text-brand-orange" />
                </div>
                <p className="mt-6 font-semibold text-lg text-gray-700">AI đang sáng tạo...</p>
                <p className="text-sm text-gray-500">Quá trình này có thể mất một vài giây, vui lòng chờ.</p>
              </div>
            ) : generatedPost ? (
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedPost}</ReactMarkdown>
              </div>
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