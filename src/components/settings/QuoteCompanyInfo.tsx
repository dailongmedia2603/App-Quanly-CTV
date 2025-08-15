import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { Upload, Building, Phone, MapPin, Mail } from 'lucide-react';

const QuoteCompanyInfo = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('quote_company_name, quote_company_address, quote_company_email, quote_company_phone, quote_logo_url')
        .single();

      if (data) {
        setCompanyName(data.quote_company_name || '');
        setAddress(data.quote_company_address || '');
        setEmail(data.quote_company_email || '');
        setPhone(data.quote_company_phone || '');
        setLogoUrl(data.quote_logo_url || '');
      } else if (error && error.code !== 'PGRST116') {
        showError('Không thể tải cài đặt công ty.');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = showLoading('Đang tải lên logo...');
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('quote_assets').upload(fileName, file);
    dismissToast(toastId);

    if (error) {
      showError(`Tải lên thất bại: ${error.message}`);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('quote_assets').getPublicUrl(data.path);
      setLogoUrl(publicUrl);
      showSuccess('Tải lên logo thành công!');
    }
    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading('Đang lưu...');
    const { error } = await supabase.from('app_settings').upsert({
      id: 1,
      quote_company_name: companyName,
      quote_company_address: address,
      quote_company_email: email,
      quote_company_phone: phone,
      quote_logo_url: logoUrl,
    });
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess('Lưu cài đặt thành công!');
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-orange-100">
      <div className="flex items-center space-x-6">
        {logoUrl && <img src={logoUrl} alt="Logo công ty" className="h-20 w-auto object-contain border rounded-md p-2 bg-gray-50" />}
        <div className="space-y-2">
          <Label htmlFor="logo-upload" className="flex items-center space-x-2"><Upload className="h-4 w-4" /><span>Logo công ty</span></Label>
          <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
          <p className="text-xs text-gray-500">Tải lên file ảnh (PNG, JPG, SVG).</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label className="flex items-center space-x-2"><Building className="h-4 w-4" /><span>Tên công ty</span></Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
        <div className="space-y-2"><Label className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>Số điện thoại</span></Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label className="flex items-center space-x-2"><MapPin className="h-4 w-4" /><span>Địa chỉ</span></Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
      <div className="space-y-2"><Label className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>Email</span></Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
        </Button>
      </div>
    </div>
  );
};

export default QuoteCompanyInfo;