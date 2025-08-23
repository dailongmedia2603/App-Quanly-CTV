import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Campaign } from './SendEmailTab'; // Assuming Campaign type is exported from SendEmailTab

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
  
  // Interval settings are now only for scheduling, but we can keep them for future use
  const [intervalValue, setIntervalValue] = useState(2);
  const [intervalUnit, setIntervalUnit] = useState('second');

  const handleConfirm = () => {
    if (!campaign) return;
    
    // For "Send Now", we just need the campaign ID. The new function handles the rest.
    // For "Schedule", we pass the schedule info.
    const settings = sendOption === 'now' 
      ? { send_now: true }
      : { scheduled_at: scheduleDate?.toISOString() };

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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="send-now" />
                <Label htmlFor="send-now">Gửi ngay bây giờ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule" id="send-schedule" disabled />
                <Label htmlFor="send-schedule" className="text-gray-400">Lên lịch gửi (Sắp ra mắt)</Label>
              </div>
            </RadioGroup>
            {sendOption === 'schedule' && (
              <div className="pt-2 pl-6">
                <DateTimePicker date={scheduleDate} setDate={setScheduleDate} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {isSubmitting ? 'Đang gửi...' : 'Xác nhận & Gửi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};