import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Briefcase, Wand2, Sparkles, Copy, History, ArrowLeft, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
}

interface EmailContent {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

const FormInput = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="flex items-center space-x-2 text-gray-600"><Icon className="h-4 w-4" /><span>{label}</span></Label>
    {children}
  </div>
);

const HistoryView = ({ onBack }: { onBack: () => void }) => {
  const [history, setHistory] = useState<EmailContent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const { data, error } = await supabase.from('email_contents').select('*').order('created_at', { ascending: false });
      if (error) showError("Không thể tải lịch sử.");
      else setHistory(data as EmailContent[]);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, []);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => showSuccess("Đã sao chép!"));
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Nội dung mail đã tạo</CardTitle>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingHistory ? (
          <p>Đang tải...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Chưa có nội dung nào được tạo.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {history.map(item => (
              <AccordionItem value={item.id} key={item.id} className="border border-orange-200 rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full min-w-0 gap-1 sm:gap-4 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600 truncate">Tiêu đề: {item.subject}</p>
                    </div>
                    <span className="text-sm text-gray-500 font-normal sm:flex-shrink-0 sm:pl-4">
                      {format(new Date(item.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-white rounded-b-lg">
                  <div className="prose max-w-none relative bg-orange-50/30 p-4 rounded-md border border-orange-100">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 text-gray-600 hover:bg-orange-100"
                      onClick={() => handleCopy(item.body)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <h4 className="font-bold !mb-2">Tiêu đề: {item.subject}</h4>
                    <hr className="!my-2" />
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.body}
                    </ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

const CreateEmailContentTab = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<EmailContent | null>(null);
  const [view, setView] = useState<'create' | 'history'>('create');
  
  // Form state
  const [name, setName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [emailGoal, setEmailGoal] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      const { data, error } = await supabase.from('document_services').select('id, name').order('name');
      if (error) showError("Không thể tải danh sách dịch vụ.");
      else setServices(data as Service[]);
      setLoadingServices(false);
    };
    fetchServices();
  }, []);

  const handleGenerate = async () => {
    if (!name || !selectedServiceId || !emailGoal) return showError("Vui lòng điền tên, chọn dịch vụ và mục tiêu.");
    setIsGenerating(true);
    setGeneratedContent(null);
    const toastId = showLoading("AI đang viết email...");
    try {
      const { data, error } = await supabase.functions.invoke('generate-email-content', { body: { name, serviceId: selectedServiceId, emailGoal, additionalInfo } });
      if (error) throw error;
      setGeneratedContent(data);
      showSuccess("Tạo nội dung email thành công!");
    } catch (error: any) {
      showError(`Tạo thất bại: ${error.message}`);
    } finally {
      dismissToast(toastId);
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => showSuccess("Đã sao chép!"));
  };

  if (view === 'history') {
    return <HistoryView onBack={() => setView('create')} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1 border-orange-200"><CardHeader><CardTitle className="flex items-center space-x-2"><Wand2 className="h-6 w-6 text-brand-orange" /><span>Cấu hình</span></CardTitle><CardDescription>Nhập thông tin để AI tạo nội dung email.</CardDescription></CardHeader><CardContent className="space-y-4"><FormInput icon={Mail} label="Tên nội dung (để quản lý)"><Input value={name} onChange={e => setName(e.target.value)} /></FormInput><FormInput icon={Briefcase} label="Dịch vụ"><Select value={selectedServiceId} onValueChange={setSelectedServiceId}><SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger><SelectContent>{loadingServices ? <SelectItem value="loading" disabled>Đang tải...</SelectItem> : services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></FormInput><FormInput icon={Mail} label="Mục tiêu email"><Textarea placeholder="VD: Giới thiệu dịch vụ, khuyến mãi..." value={emailGoal} onChange={e => setEmailGoal(e.target.value)} /></FormInput><FormInput icon={Mail} label="Thông tin thêm (nếu có)"><Textarea placeholder="VD: Chương trình giảm giá 20%..." value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} /></FormInput></CardContent><CardFooter className="flex flex-col gap-2"><Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleGenerate} disabled={isGenerating}><Wand2 className="mr-2 h-4 w-4" />{isGenerating ? 'Đang tạo...' : 'Tạo nội dung'}</Button><Button className="w-full" variant="outline" onClick={() => setView('history')}><History className="mr-2 h-4 w-4" />Nội dung đã tạo</Button></CardFooter></Card>
      <Card className="lg:col-span-2 border-orange-200 min-h-[500px]"><CardHeader><CardTitle className="flex items-center space-x-2"><Sparkles className="h-6 w-6 text-brand-orange" /><span>Kết quả</span></CardTitle></CardHeader><CardContent>{isGenerating ? <p>AI đang viết...</p> : generatedContent ? <div className="space-y-4"><div className="flex justify-between items-center"><div><Label>Tiêu đề</Label><p className="font-semibold">{generatedContent.subject}</p></div><Button variant="ghost" size="icon" onClick={() => handleCopy(generatedContent.subject)}><Copy className="h-4 w-4" /></Button></div><div className="relative"><Label>Nội dung</Label><div className="prose max-w-none bg-gray-50 p-4 rounded-md border"><ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent.body}</ReactMarkdown></div><Button variant="ghost" size="icon" className="absolute top-6 right-2" onClick={() => handleCopy(generatedContent.body)}><Copy className="h-4 w-4" /></Button></div></div> : <p className="text-center text-gray-500 py-20">Nội dung email sẽ xuất hiện ở đây.</p>}</CardContent></Card>
    </div>
  );
};

export default CreateEmailContentTab;