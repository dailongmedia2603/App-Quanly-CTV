import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';

const BankInfoSettings = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bankInfo, setBankInfo] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('bank_transfer_info, qr_code_url')
        .single();

      if (data) {
        setBankInfo(data.bank_transfer_info || '');
        setQrCodeUrl(data.qr_code_url || null);
      } else if (error && error.code !== 'PGRST116') {
        showError('Không thể tải thông tin thanh toán.');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading('Đang lưu...');
    
    let uploadedUrl = qrCodeUrl;
    if (qrFile) {
      const filePath = `public/qr-code-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, qrFile);
      
      if (uploadError) {
        dismissToast(toastId);
        showError(`Tải ảnh lên thất bại: ${uploadError.message}`);
        setIsSaving(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(uploadData.path);
      uploadedUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('app_settings').upsert({
      id: 1,
      bank_transfer_info: bankInfo,
      qr_code_url: uploadedUrl,
    });

    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess('Lưu thông tin thanh toán thành công!');
      setQrCodeUrl(uploadedUrl);
      setQrFile(null);
    }
    setIsSaving(false);
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Thông tin thanh toán</CardTitle>
        <CardDescription>Nội dung này sẽ hiển thị khi người dùng bấm nút "Nâng cấp" trên trang bảng giá.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p>Đang tải...</p> : (
          <>
            <div className="space-y-2">
              <Label htmlFor="bank-info">Nội dung chuyển khoản</Label>
              <Textarea id="bank-info" value={bankInfo} onChange={e => setBankInfo(e.target.value)} rows={6} placeholder="Tên ngân hàng, số tài khoản, chủ tài khoản, nội dung chuyển khoản..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-code">Ảnh mã QR</Label>
              <Input id="qr-code" type="file" accept="image/*" onChange={e => setQrFile(e.target.files ? e.target.files[0] : null)} />
              {(qrCodeUrl || qrFile) && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">Xem trước:</p>
                  <img src={qrFile ? URL.createObjectURL(qrFile) : qrCodeUrl!} alt="QR Code Preview" className="w-40 h-40 object-contain border rounded-md" />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BankInfoSettings;