import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import * as Icons from 'lucide-react';
import { Separator } from '../ui/separator';
import { Bot } from 'lucide-react';

// Define the keys explicitly for type safety
type IconKey = 'LifeBuoy' | 'HelpCircle' | 'MessageSquare' | 'Phone' | 'BookOpen';

const iconOptions: Record<IconKey, React.ReactNode> = {
  LifeBuoy: <Icons.LifeBuoy className="h-5 w-5" />,
  HelpCircle: <Icons.HelpCircle className="h-5 w-5" />,
  MessageSquare: <Icons.MessageSquare className="h-5 w-5" />,
  Phone: <Icons.Phone className="h-5 w-5" />,
  BookOpen: <Icons.BookOpen className="h-5 w-5" />,
};

const GeneralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Page settings
  const [pageTitle, setPageTitle] = useState('');

  // AI Settings
  const [geminiModel, setGeminiModel] = useState('');

  // Support widget settings
  const [icon, setIcon] = useState<IconKey>('LifeBuoy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('page_title, support_widget_icon, support_widget_title, support_widget_description, support_widget_link, gemini_model')
        .single();

      if (data) {
        setPageTitle(data.page_title || '');
        setGeminiModel(data.gemini_model || 'gemini-1.0-pro');
        setIcon(data.support_widget_icon as IconKey || 'LifeBuoy');
        setTitle(data.support_widget_title || '');
        setDescription(data.support_widget_description || '');
        setLink(data.support_widget_link || '');
      } else if (error && error.code !== 'PGRST116') {
        showError('Không thể tải cài đặt.');
      } else {
        setGeminiModel('gemini-1.0-pro');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading('Đang lưu...');
    const { error } = await supabase.from('app_settings').upsert({
      id: 1,
      page_title: pageTitle,
      gemini_model: geminiModel,
      support_widget_icon: icon,
      support_widget_title: title,
      support_widget_description: description,
      support_widget_link: link,
    });
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess('Lưu cài đặt thành công!');
    }
    setIsSaving(false);
  };

  if (loading) {
    return <p>Đang tải cài đặt...</p>;
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Cài đặt chung</CardTitle>
        <CardDescription>Quản lý các cài đặt chung cho toàn bộ ứng dụng.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Page Settings */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Cài đặt Trang</h3>
            <div className="space-y-2">
                <Label htmlFor="page-title">Tiêu đề trang</Label>
                <Input id="page-title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="Tiêu đề hiển thị trên tab trình duyệt" />
            </div>
        </div>

        <Separator />

        {/* AI Settings */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center"><Bot className="h-5 w-5 mr-2" />Cài đặt AI</h3>
            <div className="space-y-2">
                <Label htmlFor="gemini-model">Tên Model Gemini</Label>
                <Input id="gemini-model" value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} placeholder="VD: gemini-1.0-pro" />
                <p className="text-xs text-muted-foreground">
                  Model này sẽ được sử dụng cho tất cả các tính năng tạo nội dung bằng AI.
                </p>
            </div>
        </div>

        <Separator />

        {/* Support Widget Settings */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Widget Hỗ trợ</h3>
            <p className="text-sm text-muted-foreground">Tùy chỉnh widget hiển thị ở cuối menu bên trái.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={icon} onValueChange={(value) => setIcon(value as IconKey)}>
                <SelectTrigger>
                    <SelectValue>
                    <div className="flex items-center space-x-2">
                        {iconOptions[icon]}
                        <span>{icon}</span>
                    </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(iconOptions) as IconKey[]).map((iconKey) => (
                    <SelectItem key={iconKey} value={iconKey}>
                        <div className="flex items-center space-x-2">
                        {iconOptions[iconKey]}
                        <span>{iconKey}</span>
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="widget-title">Tiêu đề</Label>
                <Input id="widget-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="widget-desc">Mô tả</Label>
                <Input id="widget-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="widget-link">Đường dẫn</Label>
                <Input id="widget-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" />
            </div>
            </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;