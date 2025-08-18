import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Briefcase, Info, CircleDollarSign, Pencil, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageLightbox } from './ImageLightbox';

interface ServiceContentDisplayProps {
  serviceId: string | null;
  canEdit: boolean;
  onDataChange: () => void;
}

interface ServiceDetails {
  id: string;
  name: string;
  service_info_content: string | null;
  pricing_content: string | null;
  pricing_image_urls: string[] | null;
}

const ServiceContentDisplay = ({ serviceId, canEdit, onDataChange }: ServiceContentDisplayProps) => {
  const [details, setDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [infoContent, setInfoContent] = useState('');
  const [pricingContent, setPricingContent] = useState('');
  const [pricingImageUrls, setPricingImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!serviceId) {
      setDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setIsEditing(false);
      const { data, error } = await supabase
        .from('service_details')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) {
        showError("Không thể tải chi tiết dịch vụ.");
        setDetails(null);
      } else {
        setDetails(data);
        setInfoContent(data.service_info_content || '');
        setPricingContent(data.pricing_content || '');
        setPricingImageUrls(data.pricing_image_urls || []);
      }
      setLoading(false);
    };

    fetchDetails();
  }, [serviceId]);

  const handleSave = async () => {
    if (!details) return;
    const toastId = showLoading("Đang lưu...");
    const { error } = await supabase
      .from('service_details')
      .update({
        service_info_content: infoContent,
        pricing_content: pricingContent,
        pricing_image_urls: pricingImageUrls
      })
      .eq('id', details.id);
    
    dismissToast(toastId);
    if (error) {
      showError("Lưu thất bại.");
    } else {
      showSuccess("Lưu thành công!");
      setIsEditing(false);
      onDataChange();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = showLoading("Đang tải ảnh lên...");

    const filePath = `public/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('service_pricing_images')
      .upload(filePath, file);

    dismissToast(toastId);
    if (uploadError) {
      showError(`Tải ảnh thất bại: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('service_pricing_images')
      .getPublicUrl(filePath);
    
    setPricingImageUrls(prev => [...prev, publicUrl]);
    showSuccess("Tải ảnh lên thành công!");
    setIsUploading(false);
  };

  const handleImageDelete = (indexToDelete: number) => {
    setPricingImageUrls(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
        <Briefcase className="h-16 w-16 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium">Chọn một dịch vụ</h3>
        <p className="text-sm">Chọn một dịch vụ từ danh sách bên trái để xem chi tiết.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 h-full overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{details.name}</h1>
            <p className="text-gray-500">Thông tin chi tiết và báo giá</p>
          </div>
          {canEdit && (
            isEditing ? (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
                <Button onClick={handleSave} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Save className="h-4 w-4 mr-2" />Lưu</Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Pencil className="h-4 w-4 mr-2" />Sửa nội dung</Button>
            )
          )}
        </div>
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={['info', 'pricing']}>
          <AccordionItem value="info" className="border border-orange-100 rounded-lg bg-white/50">
            <AccordionTrigger className="p-4 hover:no-underline">
              <h2 className="text-xl font-semibold flex items-center space-x-3">
                <Info className="h-5 w-5 text-brand-orange" />
                <span>Thông tin dịch vụ</span>
              </h2>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="pl-8 border-l-2 border-orange-100">
                {isEditing ? (
                  <Textarea value={infoContent} onChange={e => setInfoContent(e.target.value)} className="min-h-[200px]" />
                ) : (
                  <div className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{infoContent || "Chưa có nội dung."}</ReactMarkdown></div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pricing" className="border border-orange-100 rounded-lg bg-white/50">
            <AccordionTrigger className="p-4 hover:no-underline">
              <h2 className="text-xl font-semibold flex items-center space-x-3">
                <CircleDollarSign className="h-5 w-5 text-brand-orange" />
                <span>Báo giá</span>
              </h2>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="pl-8 border-l-2 border-orange-100 space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea value={pricingContent} onChange={e => setPricingContent(e.target.value)} className="min-h-[150px]" placeholder="Nhập nội dung báo giá..." />
                    <div>
                      <Label>Ảnh báo giá</Label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {pricingImageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img src={url} alt={`Báo giá ${index + 1}`} className="w-full h-auto object-cover rounded-md border" />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleImageDelete(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        {isUploading && <p className="text-sm text-gray-500 mt-1">Đang tải lên...</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="prose max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {pricingContent || ""}
                      </ReactMarkdown>
                    </div>
                    {pricingImageUrls && pricingImageUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {pricingImageUrls.map((url, index) => (
                          <img 
                            key={index} 
                            src={url} 
                            alt={`Báo giá ${index + 1}`} 
                            className="w-full h-auto object-cover rounded-md border cursor-pointer transition-transform hover:scale-105"
                            onClick={() => openLightbox(index)}
                          />
                        ))}
                      </div>
                    )}
                    {!pricingContent && (!pricingImageUrls || pricingImageUrls.length === 0) && (
                      <p className="text-gray-500 italic">Chưa có nội dung báo giá.</p>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <ImageLightbox
        isOpen={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        images={pricingImageUrls || []}
        selectedIndex={selectedImageIndex}
        onSelectedIndexChange={setSelectedImageIndex}
      />
    </>
  );
};

export default ServiceContentDisplay;