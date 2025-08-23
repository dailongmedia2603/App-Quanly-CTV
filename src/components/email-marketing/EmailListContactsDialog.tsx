import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showError, showLoading, showSuccess, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface EmailListContactsDialogProps {
  listId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onContactsUpdate: () => void;
}

export const EmailListContactsDialog = ({ listId, isOpen, onOpenChange, onContactsUpdate }: EmailListContactsDialogProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmails, setNewEmails] = useState('');

  const fetchContacts = async () => {
    if (!listId) return;
    setLoading(true);
    const { data, error } = await supabase.from('email_list_contacts').select('*').eq('list_id', listId).order('created_at', { ascending: false });
    if (error) showError("Không thể tải danh sách liên hệ.");
    else setContacts(data as Contact[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchContacts();
  }, [isOpen, listId]);

  const handleAddContacts = async () => {
    if (!listId || !newEmails.trim()) return showError("Vui lòng nhập ít nhất một email.");
    
    const emails = newEmails.split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emails.length === 0) {
      return showError("Không tìm thấy email hợp lệ nào để thêm.");
    }

    setIsAdding(true);
    const toastId = showLoading(`Đang thêm ${emails.length} liên hệ...`);

    const contactsToInsert = emails.map(email => ({
      list_id: listId,
      email: email,
    }));

    const { error } = await supabase.from('email_list_contacts').insert(contactsToInsert);
    
    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess(`Thêm thành công ${emails.length} liên hệ!`);
      setNewEmails('');
      fetchContacts();
      onContactsUpdate();
    }
    setIsAdding(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('email_list_contacts').delete().eq('id', contactId);
    dismissToast(toastId);
    if (error) showError(`Xóa thất bại: ${error.message}`);
    else { showSuccess("Xóa liên hệ thành công!"); fetchContacts(); onContactsUpdate(); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Quản lý Liên hệ</DialogTitle><DialogDescription>Thêm, xóa và quản lý các liên hệ trong danh sách này.</DialogDescription></DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="border p-4 rounded-lg space-y-4">
            <h3 className="font-semibold">Thêm liên hệ mới</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Emails</Label>
                <Textarea 
                  id="emails" 
                  value={newEmails} 
                  onChange={e => setNewEmails(e.target.value)} 
                  placeholder="Dán danh sách email vào đây, mỗi email một dòng."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <div className="flex justify-end"><Button onClick={handleAddContacts} disabled={isAdding} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />{isAdding ? 'Đang thêm...' : 'Thêm'}</Button></div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Danh sách liên hệ</h3>
            <ScrollArea className="h-64"><Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Ngày thêm</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={3} className="text-center">Đang tải...</TableCell></TableRow> : contacts.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center">Chưa có liên hệ nào.</TableCell></TableRow> : (contacts.map(c => (<TableRow key={c.id}><TableCell>{c.email}</TableCell><TableCell>{format(new Date(c.created_at), 'dd/MM/yyyy')}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteContact(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)))}</TableBody></Table></ScrollArea>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};