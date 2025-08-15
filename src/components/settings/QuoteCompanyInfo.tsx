import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { Upload } from 'lucide-react';

const QuoteCompanyInfo = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

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
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Thông tin công ty trên báo giá</CardTitle>
        <CardDescription>Cấu hình logo và thông tin sẽ hiển thị trên đầu mỗi báo giá được tạo ra.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-6">
          {logoUrl && <img src={logoUrl} alt="Logo công ty" className="h-20 w-auto object-contain border rounded-md p-2 bg-gray-50" />}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Logo công ty</Label>
            <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
            <p className="text-xs text-gray-500">Tải lên file ảnh (PNG, JPG, SVG).</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Tên công ty</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Số điện thoại</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Địa chỉ</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuoteCompanyInfo;