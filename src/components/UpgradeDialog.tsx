import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

interface UpgradeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const UpgradeDialog = ({ isOpen, onOpenChange }: UpgradeDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('app_settings')
        .select('bank_transfer_info, qr_code_url')
        .single();
      if (data) {
        setBankInfo(data.bank_transfer_info || 'Vui lòng liên hệ quản trị viên để biết thông tin thanh toán.');
        setQrCodeUrl(data.qr_code_url || null);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
        <DialogHeader>
          <DialogTitle>Thông tin nâng cấp</DialogTitle>
          <DialogDescription>Vui lòng thực hiện thanh toán theo thông tin dưới đây để nâng cấp gói.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-brand-orange" /></div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="whitespace-pre-wrap p-4 bg-orange-50 border border-orange-200 rounded-md text-sm text-gray-700">
              {bankInfo}
            </div>
            {qrCodeUrl && (
              <div className="text-center">
                <img src={qrCodeUrl} alt="Mã QR thanh toán" className="mx-auto w-52 h-52 object-contain border rounded-md" />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;