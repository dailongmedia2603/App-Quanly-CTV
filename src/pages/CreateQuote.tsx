import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MultiSelectCombobox, SelectOption } from '@/components/ui/multi-select-combobox';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { Wand2, Sparkles, History, ArrowLeft, FileText, Copy, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import QuoteDisplay from '@/components/QuoteDisplay';

interface Service {
  id: string;
  name: string;
}

interface GeneratedQuote {
  id: string;
  name: string;
  created_at: string;
  generated_content: string;
  budget: number;
  final_price: number;
}

const formatNumberWithDots = (value: number | string) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = String(value).replace(/\./g, '');
  if (isNaN(Number(num))) return '';
  return new Intl.NumberFormat('de-DE').format(Number(num));
};

const parseFormattedNumber = (value: string) => {
  return Number(String(value).replace(/\./g, ''));
};

const QuoteHistoryView = ({ onBack, onSelectQuote }: { onBack: () => void, onSelectQuote: (quote: GeneratedQuote) => void }) => {
  const [quotes, setQuotes] = useState<GeneratedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteToDelete, setQuoteToDelete] = useState<GeneratedQuote | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('generated_quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) showError("Không thể tải lịch sử báo giá.");
    else setQuotes(data as GeneratedQuote[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async () => {
    if (!quoteToDelete) return;
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('generated_quotes').delete().eq('id', quoteToDelete.id);
    dismissToast(toastId);
    if (error) showError("Xóa thất bại.");
    else { showSuccess("Đã xóa báo giá."); fetchHistory(); }
    setQuoteToDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Báo giá đã tạo</h1>
          <p className="text-gray-500 mt-1">Xem lại các báo giá bạn đã tạo trước đây.</p>
        </div>
        <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>
      </div>
      <Card className="border-orange-200">
        <CardContent className="p-6">
          {loading ? <p>Đang tải...</p> : quotes.length === 0 ? (
            <div className="text-center text-gray-500 py-10"><FileText className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-4 font-medium">Chưa có báo giá nào</p></div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {quotes.map(quote => (
                <AccordionItem value={quote.id} key={quote.id} className="bg-white border border-orange-200 rounded-lg shadow-sm">
                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg" onClick={() => onSelectQuote(quote)}>
                    <div className="flex justify-between items-center w-full min-w-0 gap-4">
                      <span className="font-semibold text-left text-gray-800 truncate">{quote.name}</span>
                      <span className="text-sm text-gray-500 font-normal flex-shrink-0">{format(new Date(quote.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-white rounded-b-lg">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); setQuoteToDelete(quote); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn báo giá "{quoteToDelete?.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CreateQuote = () => {
  const [view, setView] = useState<'create' | 'history'>('create');
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(null);

  // Form state
  const [quoteName, setQuoteName] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<number | ''>('');
  const [includesVat, setIncludesVat] = useState('yes');
  const [otherRequirements, setOtherRequirements] = useState('');

  const serviceOptions = useMemo<SelectOption[]>(() => services.map(s => ({ value: s.id, label: s.name })), [services]);

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

  const handleGenerateQuote = async () => {
    if (!budget || selectedServiceIds.length === 0) {
      return showError("Vui lòng nhập ngân sách và chọn ít nhất một dịch vụ.");
    }
    setIsGenerating(true);
    setGeneratedQuote(null);
    const toastId = showLoading("AI đang phân tích và tạo báo giá...");

    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          name: quoteName,
          budget: budget,
          serviceIds: selectedServiceIds,
          includesVat: includesVat === 'yes',
          otherRequirements: otherRequirements,
        }
      });
      if (error) throw error;
      setGeneratedQuote(data);
      showSuccess("Tạo báo giá thành công!");
    } catch (error: any) {
      showError(`Tạo báo giá thất bại: ${error.message}`);
    } finally {
      dismissToast(toastId);
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedQuote?.generated_content) return;
    navigator.clipboard.writeText(generatedQuote.generated_content).then(() => {
      showSuccess("Đã sao chép nội dung báo giá!");
    });
  };

  const handleSelectQuoteFromHistory = (quote: GeneratedQuote) => {
    setGeneratedQuote(quote);
    setView('create');
  };

  if (view === 'history') {
    return <QuoteHistoryView onBack={() => setView('create')} onSelectQuote={handleSelectQuoteFromHistory} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Tạo báo giá tự động</h1><p className="text-gray-500 mt-1">Nhập ngân sách và yêu cầu, AI sẽ tạo ra một báo giá chuyên nghiệp.</p></div>
        <Button onClick={() => setView('history')} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><History className="mr-2 h-4 w-4" />Lịch sử báo giá</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1 border-orange-200 sticky top-8">
          <CardHeader><CardTitle className="flex items-center space-x-2"><Wand2 className="h-6 w-6 text-brand-orange" /><span>Cấu hình</span></CardTitle><CardDescription>Nhập thông tin để AI tạo báo giá.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Tên báo giá (tùy chọn)</Label><Input placeholder={`Báo giá ngày ${format(new Date(), 'dd/MM/yyyy')}`} value={quoteName} onChange={e => setQuoteName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Dịch vụ</Label><MultiSelectCombobox options={serviceOptions} selected={selectedServiceIds} onChange={setSelectedServiceIds} placeholder="Chọn dịch vụ" searchPlaceholder="Tìm dịch vụ..." emptyPlaceholder="Không tìm thấy." /></div>
            <div className="space-y-2"><Label>Ngân sách (VND)</Label><Input placeholder="VD: 50.000.000" value={formatNumberWithDots(budget)} onChange={e => setBudget(parseFormattedNumber(e.target.value))} /></div>
            <div className="space-y-2"><Label>Thuế</Label><RadioGroup value={includesVat} onValueChange={setIncludesVat} className="flex items-center space-x-4"><div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="vat-yes" /><Label htmlFor="vat-yes">Có VAT (10%)</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="vat-no" /><Label htmlFor="vat-no">Không VAT</Label></div></RadioGroup></div>
            <div className="space-y-2"><Label>Yêu cầu khác (nếu có)</Label><Textarea placeholder="VD: Nhấn mạnh vào các dịch vụ social media..." value={otherRequirements} onChange={e => setOtherRequirements(e.target.value)} /></div>
          </CardContent>
          <CardFooter><Button className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleGenerateQuote} disabled={isGenerating}><Wand2 className="mr-2 h-4 w-4" />{isGenerating ? 'Đang tạo...' : 'Tạo báo giá'}</Button></CardFooter>
        </Card>
        <Card className="lg:col-span-2 border-orange-200 min-h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center space-x-2"><Sparkles className="h-6 w-6 text-brand-orange" /><span>Báo giá được tạo ra</span></CardTitle><CardDescription>Đây là báo giá do AI tạo ra dựa trên cấu hình của bạn.</CardDescription></div>
            {generatedQuote && <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="h-4 w-4 mr-2" />Sao chép</Button>}
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 py-20"><Sparkles className="h-12 w-12 text-brand-orange animate-pulse" /><p className="mt-4 font-semibold text-gray-700">AI đang phân tích...</p></div>
            ) : generatedQuote ? (
              <QuoteDisplay content={generatedQuote.generated_content} />
            ) : (
              <div className="text-center text-gray-500 py-20"><Sparkles className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-4 font-medium">Báo giá của bạn sẽ xuất hiện ở đây</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuote;