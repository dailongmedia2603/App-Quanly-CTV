import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Copy, History, ArrowLeft, Trash2, Folder, FolderPlus, Move } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface EmailContent {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  group_id: string | null;
}

interface EmailContentGroup {
  id: string;
  name: string;
}

const getHtmlBodyContent = (htmlString: string | null): string => {
  if (!htmlString) return '';
  const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : htmlString;
};

const EmailContentHistoryView = ({ onBack }: { onBack: () => void }) => {
  const [history, setHistory] = useState<EmailContent[]>([]);
  const [groups, setGroups] = useState<EmailContentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [historyRes, groupsRes] = await Promise.all([
      supabase.from('email_contents').select('*').order('created_at', { ascending: false }),
      supabase.from('email_content_groups').select('*').order('name')
    ]);
    if (historyRes.error) showError("Không thể tải lịch sử.");
    else setHistory(historyRes.data as EmailContent[]);
    if (groupsRes.error) showError("Không thể tải nhóm.");
    else setGroups(groupsRes.data as EmailContentGroup[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedContent = useMemo(() => {
    const grouped: Record<string, EmailContent[]> = { 'ungrouped': [] };
    groups.forEach(g => grouped[g.id] = []);
    history.forEach(item => {
      const groupId = item.group_id || 'ungrouped';
      if (!grouped[groupId]) grouped[groupId] = [];
      grouped[groupId].push(item);
    });
    return grouped;
  }, [history, groups]);

  const handleCopy = (subject: string, body: string) => {
    const bodyContent = getHtmlBodyContent(body);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyContent;
    const plainText = `Tiêu đề: ${subject}\n\n${tempDiv.innerText || ""}`;
    navigator.clipboard.writeText(plainText).then(() => showSuccess("Đã sao chép!"));
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const confirmDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    const toastId = showLoading(`Đang xóa ${selectedIds.length} mục...`);
    const { error } = await supabase.from('email_contents').delete().in('id', selectedIds);
    dismissToast(toastId);
    if (error) showError(`Xóa thất bại: ${error.message}`);
    else { showSuccess("Xóa thành công!"); setSelectedIds([]); fetchData(); }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('email_content_groups').insert({ name: newGroupName });
    if (error) showError("Tạo nhóm thất bại.");
    else { showSuccess("Tạo nhóm thành công!"); setIsGroupDialogOpen(false); setNewGroupName(''); fetchData(); }
    setIsSubmitting(false);
  };

  const handleMoveToGroup = async (groupId: string | null) => {
    setIsMovePopoverOpen(false);
    if (selectedIds.length === 0) return;
    const toastId = showLoading("Đang di chuyển...");
    const { error } = await supabase.from('email_contents').update({ group_id: groupId }).in('id', selectedIds);
    dismissToast(toastId);
    if (error) showError("Di chuyển thất bại.");
    else { showSuccess("Di chuyển thành công!"); setSelectedIds([]); fetchData(); }
  };

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Nội dung mail đã tạo</CardTitle>
            <div className="flex items-center space-x-2">
              {selectedIds.length > 0 && (
                <>
                  <Popover open={isMovePopoverOpen} onOpenChange={setIsMovePopoverOpen}>
                    <PopoverTrigger asChild><Button variant="outline"><Move className="mr-2 h-4 w-4" />Chuyển tới nhóm</Button></PopoverTrigger>
                    <PopoverContent className="p-0 w-56"><Command><CommandInput placeholder="Tìm nhóm..." /><CommandList><CommandEmpty>Không tìm thấy nhóm.</CommandEmpty><CommandGroup><CommandItem onSelect={() => handleMoveToGroup(null)}>Bỏ nhóm</CommandItem>{groups.map(g => <CommandItem key={g.id} onSelect={() => handleMoveToGroup(g.id)}>{g.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                  </Popover>
                  <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedIds.length})</Button>
                </>
              )}
              <Button onClick={() => setIsGroupDialogOpen(true)} variant="outline"><FolderPlus className="mr-2 h-4 w-4" />Tạo nhóm mới</Button>
              <Button onClick={onBack} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><ArrowLeft className="mr-2 h-4 w-4" />Tạo nội dung</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p>Đang tải...</p> : (
            <Accordion type="multiple" className="w-full space-y-4" defaultValue={['ungrouped', ...groups.map(g => g.id)]}>
              {groups.map(group => (
                <AccordionItem value={group.id} key={group.id}>
                  <AccordionTrigger className="font-semibold"><div className="flex items-center space-x-2"><Folder className="h-5 w-5 text-brand-orange" /><span>{group.name} ({groupedContent[group.id]?.length || 0})</span></div></AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-2">
                    {(groupedContent[group.id] || []).map(item => <ContentItem key={item.id} item={item} selectedIds={selectedIds} onSelect={handleSelect} onCopy={handleCopy} />)}
                  </AccordionContent>
                </AccordionItem>
              ))}
              <AccordionItem value="ungrouped">
                <AccordionTrigger className="font-semibold"><div className="flex items-center space-x-2"><Folder className="h-5 w-5 text-gray-400" /><span>Chưa phân loại ({groupedContent['ungrouped']?.length || 0})</span></div></AccordionTrigger>
                <AccordionContent className="pt-2 space-y-2">
                  {(groupedContent['ungrouped'] || []).map(item => <ContentItem key={item.id} item={item} selectedIds={selectedIds} onSelect={handleSelect} onCopy={handleCopy} />)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}><DialogContent><DialogHeader><DialogTitle>Tạo nhóm mới</DialogTitle></DialogHeader><div className="py-4"><Label>Tên nhóm</Label><Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Hủy</Button><Button onClick={handleCreateGroup} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang tạo...' : 'Tạo'}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa {selectedIds.length} nội dung đã chọn không?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
};

const ContentItem = ({ item, selectedIds, onSelect, onCopy }: { item: EmailContent, selectedIds: string[], onSelect: (id: string, checked: boolean) => void, onCopy: (subject: string, body: string) => void }) => (
  <div className="border border-orange-100 rounded-lg bg-white shadow-sm">
    <div className="p-4 flex items-center w-full gap-4">
      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={(c) => onSelect(item.id, c as boolean)} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{item.name}</p>
        <p className="text-sm text-gray-600 truncate">Tiêu đề: {item.subject}</p>
        <p className="text-xs text-gray-400">{format(new Date(item.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-orange-100" onClick={() => onCopy(item.subject, item.body)}><Copy className="h-4 w-4" /></Button>
    </div>
  </div>
);

export default EmailContentHistoryView;