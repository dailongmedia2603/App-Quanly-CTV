import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Briefcase, Mail, Wand2, Sparkles, Copy, Phone, Link as LinkIcon } from 'lucide-react';

const FormInput = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="flex items-center space-x-2 text-gray-600"><Icon className="h-4 w-4" /><span>{label}</span></Label>
    {children}
  </div>
);

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

const getHtmlBodyContent = (htmlString: string | null): string => {
  if (!htmlString) return '';
  const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : htmlString;
};

const CreateEmailContentTab = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<EmailContent | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [emailGoal, setEmailGoal] = useState('Giới thiệu dịch vụ');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ctaLink, setCtaLink] = useState('');
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
      const { data, error } = await supabase.functions.invoke('generate-email-content', { body: { name, serviceId: selectedServiceId, emailGoal, additionalInfo, phoneNumber, ctaLink } });
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

  const handleCopySubject = (subject: string) => {
    navigator.clipboard.writeText(subject).then(() => showSuccess("Đã sao chép tiêu đề!"));
  };

  const handleCopyBody = (body: string) => {
    const bodyContent = getHtmlBodyContent(body);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyContent;
    const plainText = tempDiv.innerText || "";
    navigator.clipboard.writeText(plainText).then(() => {
      showSuccess("Đã sao chép nội dung!");
    }).catch(err => {
      showError("Không thể sao chép.");
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1 border-orange-200"><CardHeader><CardTitle className="flex items-center space-x-2"><Wand2 className="h-6 w-6 text-brand-orange" /><span>Cấu hình</span></CardTitle><CardDescription>Nhập thông tin để AI tạo nội dung email.</CardDescription></CardHeader><CardContent className="space-y-4"><FormInput icon={Mail} label="Tên nội dung (để quản lý)"><Input value={name} onChange={e => setName(e.target.value)} /></FormInput><FormInput icon={Briefcase} label="Dịch vụ"><Select value={selectedServiceId} onValueChange={setSelectedServiceId}><SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger><SelectContent>{loadingServices ? <SelectItem value="loading" disabled>Đang tải...</SelectItem> : services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></FormInput>
            <FormInput icon={Mail} label="Mục tiêu email">
              <Select value={emailGoal} onValueChange={(value) => setEmailGoal(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mục tiêu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Giới thiệu dịch vụ">Giới thiệu dịch vụ</SelectItem>
                  <SelectItem value="Lời mời Agency hợp tác">Lời mời Agency hợp tác</SelectItem>
                </SelectContent>
              </Select>
            </FormInput>
            <FormInput icon={Phone} label="Số điện thoại liên hệ"><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Nhập số điện thoại của bạn" /></FormInput><FormInput icon={LinkIcon} label="Link CTA (Call-to-action)"><Input value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="VD: https://vuaseeding.top/lien-he" /></FormInput><FormInput icon={Mail} label="Thông tin thêm (nếu có)"><Textarea placeholder="VD: Chương trình giảm giá 20%..." value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} /></FormInput></CardContent><CardFooter className="flex flex-col gap-2"><Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleGenerate} disabled={isGenerating}><Wand2 className="mr-2 h-4 w-4" />{isGenerating ? 'Đang tạo...' : 'Tạo nội dung'}</Button></CardFooter></Card>
      <Card className="lg:col-span-2 border-orange-200 min-h-[500px]"><CardHeader><CardTitle className="flex items-center space-x-2"><Sparkles className="h-6 w-6 text-brand-orange" /><span>Kết quả</span></CardTitle></CardHeader><CardContent>{isGenerating ? <p>AI đang viết...</p> : generatedContent ? <div className="space-y-4"><div className="flex justify-between items-center"><div><Label>Tiêu đề</Label><p className="font-semibold">{generatedContent.subject}</p></div><Button variant="ghost" size="icon" onClick={() => handleCopySubject(generatedContent.subject)}><Copy className="h-4 w-4" /></Button></div><div className="relative"><Label>Nội dung</Label><div className="prose max-w-none bg-gray-50 p-4 rounded-md border"><div dangerouslySetInnerHTML={{ __html: getHtmlBodyContent(generatedContent.body) }} /></div><Button variant="ghost" size="icon" className="absolute top-6 right-2" onClick={() => handleCopyBody(generatedContent.body)}><Copy className="h-4 w-4" /></Button></div></div> : <p className="text-center text-gray-500 py-20">Nội dung email sẽ xuất hiện ở đây.</p>}</CardContent></Card>
    </div>
  );
};

export default CreateEmailContentTab;