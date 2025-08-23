import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Campaign } from './SendEmailTab';

interface SendCampaignDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  campaign: Campaign | null;
  onConfirm: (campaignId: string, settings: any) => void;
  isSubmitting: boolean;
}

export const SendCampaignDialog = ({ isOpen, onOpenChange, campaign, onConfirm, isSubmitting }: SendCampaignDialogProps) => {
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [intervalValue, setIntervalValue] = useState(2);
  const [intervalUnit, setIntervalUnit] = useState('minute');

  const handleConfirm = () => {
    if (!campaign) return;
    
    const settings = {
      scheduled_at: sendOption === 'now' ? new Date().toISOString() : scheduleDate?.toISOString(),
      send_interval_value: intervalValue,
      send_interval_unit: intervalUnit,
    };

    onConfirm(campaign.id, settings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gửi chiến dịch: {campaign?.name}</DialogTitle>
          <DialogDescription>Cấu hình các tùy chọn trước khi gửi chiến dịch email của bạn.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>Thời gian gửi</Label>
            <RadioGroup value={sendOption} onValueChange={(value) => setSendOption(value as 'now' | 'schedule')} className="space-y-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="now" id="send-now" /><Label htmlFor="send-now">Gửi ngay bây giờ</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="schedule" id="send-schedule" /><Label htmlFor="send-schedule">Lên lịch gửi</Label></div>
            </RadioGroup>
            {sendOption === 'schedule' && (
              <div className="pt-2 pl-6"><DateTimePicker date={scheduleDate} setDate={setScheduleDate} /></div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tần suất gửi</Label>
            <div className="flex items-center space-x-2">
              <Input type="number" min="1" value={intervalValue} onChange={(e) => setIntervalValue(parseInt(e.target.value, 10))} className="w-24" />
              <Select value={intervalUnit} onValueChange={setIntervalUnit}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minute">Phút</SelectItem>
                  <SelectItem value="hour">Giờ</SelectItem>
                  <SelectItem value="day">Ngày</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">/ email</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Gửi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};