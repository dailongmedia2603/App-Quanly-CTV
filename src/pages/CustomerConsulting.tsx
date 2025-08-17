import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Plus, MessageSquare, Send, Bot, User as UserIcon, Trash2, Pencil, Check, History, Copy, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MultiSelectCombobox, SelectOption } from '@/components/ui/multi-select-combobox';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: string;
  name: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  service_ids: string[];
  service_names?: string[];
  customer_salutation: 'Anh' | 'Chị' | 'A/C';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/#+\s/g, '') // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
    .replace(/~~(.*?)~~/g, '$1'); // Strikethrough
};

const CustomerConsulting = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isReplying, setIsReplying] = useState(false);
  const [editingTitle, setEditingTitle] = useState<{ id: string; title: string } | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateDirection, setRegenerateDirection] = useState('');
  const [messageToRegenerate, setMessageToRegenerate] = useState<Message | null>(null);
  const [customerSalutation, setCustomerSalutation] = useState<'Anh' | 'Chị' | 'A/C'>('A/C');
  
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [tempSelectedServiceIds, setTempSelectedServiceIds] = useState<string[]>([]);

  const serviceOptions = useMemo<SelectOption[]>(() => services.map(s => ({ value: s.id, label: s.name })), [services]);

  const fetchServicesAndSessions = async () => {
    const [servicesRes, sessionsRes] = await Promise.all([
      supabase.from('document_services').select('id, name'),
      supabase.from('consulting_sessions').select('*').order('created_at', { ascending: false })
    ]);

    if (servicesRes.error) showError("Không thể tải dịch vụ.");
    else setServices(servicesRes.data as Service[]);

    if (sessionsRes.error) showError("Không thể tải lịch sử chat.");
    else {
      const serviceMap = new Map(servicesRes.data.map((s: Service) => [s.id, s.name]));
      const formattedSessions = sessionsRes.data.map(s => ({ ...s, service_names: s.service_ids?.map((id: string) => serviceMap.get(id) || 'Không rõ') || [] }));
      setSessions(formattedSessions as Session[]);
    }
  };

  useEffect(() => {
    fetchServicesAndSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = async (session: Session) => {
    setActiveSession(session);
    setCustomerSalutation(session.customer_salutation || 'A/C');
    const { data, error } = await supabase.from('consulting_messages').select('*').eq('session_id', session.id).order('created_at');
    if (error) showError("Không thể tải tin nhắn.");
    else setMessages(data as Message[]);
  };

  const handleNewChat = async () => {
    if (!selectedServiceId) {
      showError("Vui lòng chọn một dịch vụ để bắt đầu cuộc trò chuyện mới.");
      return;
    }
    const selectedService = services.find(s => s.id === selectedServiceId);
    const newTitle = `Tư vấn ${selectedService?.name || 'mới'} - ${format(new Date(), 'dd/MM')}`;
    
    const { data, error } = await supabase.from('consulting_sessions').insert({
      user_id: user!.id,
      service_ids: [selectedServiceId],
      title: newTitle
    }).select('*').single();

    if (error) {
      showError("Không thể tạo cuộc trò chuyện mới.");
    } else {
      const serviceMap = new Map(services.map(s => [s.id, s.name]));
      const formattedSession = { ...data, service_names: data.service_ids?.map((id: string) => serviceMap.get(id) || 'Không rõ') || [] };
      setSessions([formattedSession as Session, ...sessions]);
      handleSelectSession(formattedSession as Session);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;
    const customerMessage = { id: 'temp-user', role: 'user' as const, content: newMessage };
    setMessages(prev => [...prev, customerMessage]);
    setNewMessage('');
    setIsReplying(true);

    const { error: insertError } = await supabase.from('consulting_messages').insert({
      session_id: activeSession.id,
      role: 'user',
      content: newMessage
    });
    if (insertError) {
      showError("Lỗi khi gửi tin nhắn.");
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
      setIsReplying(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke('generate-consulting-response', {
      body: {
        sessionId: activeSession.id,
        serviceIds: activeSession.service_ids,
        messages: [...messages, customerMessage].map(({ role, content }) => ({ role, content })),
        customerSalutation,
      }
    });

    if (error) {
      showError(`AI gặp lỗi: ${error.message}`);
    } else {
      const aiMessage = { id: 'temp-ai', role: 'assistant' as const, content: data.reply };
      setMessages(prev => [...prev.filter(m => m.id !== 'temp-user'), { ...customerMessage, id: 'real-user-id' }, aiMessage]);
      fetchServicesAndSessions(); // To refresh message IDs properly
      handleSelectSession(activeSession);
    }
    setIsReplying(false);
  };

  const handleUpdateTitle = async () => {
    if (!editingTitle) return;
    const { error } = await supabase.from('consulting_sessions').update({ title: editingTitle.title }).eq('id', editingTitle.id);
    if (error) {
      showError("Cập nhật tiêu đề thất bại.");
    } else {
      showSuccess("Đã cập nhật tiêu đề.");
      setSessions(sessions.map(s => s.id === editingTitle.id ? { ...s, title: editingTitle.title } : s));
      setEditingTitle(null);
    }
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUpdateTitle();
    }
  };

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleteAlertOpen(false);
    const toastId = showLoading("Đang xóa cuộc trò chuyện...");
    
    const { error } = await supabase.from('consulting_sessions').delete().eq('id', sessionToDelete.id);
    
    dismissToast(toastId);
    if (error) {
        showError(`Xóa thất bại: ${error.message}`);
    } else {
        showSuccess("Đã xóa cuộc trò chuyện.");
        setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id));
        if (activeSession?.id === sessionToDelete.id) {
            setActiveSession(null);
            setMessages([]);
        }
    }
    setSessionToDelete(null);
  };

  const handleCopy = (content: string) => {
    const plainText = stripMarkdown(content);
    navigator.clipboard.writeText(plainText).then(() => {
        showSuccess("Đã sao chép nội dung!");
    }).catch(err => {
        showError("Không thể sao chép.");
    });
  };

  const handleRegenerateClick = (message: Message) => {
      setMessageToRegenerate(message);
      setIsRegenerateDialogOpen(true);
  };

  const handleRegenerateMessage = async () => {
      if (!messageToRegenerate || !activeSession) return;

      setIsReplying(true);
      setIsRegenerateDialogOpen(false);
      const toastId = showLoading("AI đang viết lại câu trả lời...");

      const messageIndex = messages.findIndex(m => m.id === messageToRegenerate.id);
      const historyForPrompt = messages.slice(0, messageIndex);

      const { data, error } = await supabase.functions.invoke('regenerate-consulting-response', {
          body: {
              messageId: messageToRegenerate.id,
              sessionId: activeSession.id,
              serviceIds: activeSession.service_ids,
              messages: historyForPrompt.map(({ role, content }) => ({ role, content })),
              regenerateDirection: regenerateDirection,
              customerSalutation,
          }
      });

      dismissToast(toastId);
      if (error) {
          showError(`Tạo lại thất bại: ${error.message}`);
      } else {
          showSuccess("Đã tạo lại câu trả lời!");
          setMessages(prev => prev.map(msg => 
              msg.id === messageToRegenerate.id ? { ...msg, content: data.reply } : msg
          ));
          setRegenerateDirection('');
          setMessageToRegenerate(null);
      }
      setIsReplying(false);
  };

  const handleSalutationChange = async (salutation: 'Anh' | 'Chị' | 'A/C') => {
    if (!activeSession || !salutation) return;

    const oldSalutation = customerSalutation;
    setCustomerSalutation(salutation);

    const { error } = await supabase
      .from('consulting_sessions')
      .update({ customer_salutation: salutation })
      .eq('id', activeSession.id);

    if (error) {
      showError("Không thể cập nhật xưng hô.");
      setCustomerSalutation(oldSalutation); // Revert on failure
    } else {
      const updatedSession = { ...activeSession, customer_salutation: salutation };
      setActiveSession(updatedSession);
      setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
    }
  };

  const handleUpdateSessionServices = async () => {
    if (!activeSession) return;
    const toastId = showLoading("Đang cập nhật dịch vụ...");
    const { error } = await supabase
        .from('consulting_sessions')
        .update({ service_ids: tempSelectedServiceIds })
        .eq('id', activeSession.id);
    dismissToast(toastId);
    if (error) {
        showError("Cập nhật thất bại.");
    } else {
        showSuccess("Đã cập nhật dịch vụ.");
        const serviceMap = new Map(services.map(s => [s.id, s.name]));
        const updatedSession = {
            ...activeSession,
            service_ids: tempSelectedServiceIds,
            service_names: tempSelectedServiceIds.map(id => serviceMap.get(id) || 'Không rõ')
        };
        setActiveSession(updatedSession);
        setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
        setIsAddServiceOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
        <div>
          <h1 className="text-3xl font-bold">Tư vấn khách hàng</h1>
          <p className="text-gray-500 mt-1">Công cụ AI hỗ trợ tư vấn và trả lời khách hàng.</p>
        </div>
        <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border border-orange-200 bg-white">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <div className="flex flex-col h-full p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <History className="h-5 w-5 text-brand-orange" />
                <span>Lịch sử trò chuyện</span>
              </h2>
              <div className="flex items-center space-x-2 mb-4">
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger>
                  <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={handleNewChat} size="icon" className="bg-brand-orange hover:bg-brand-orange/90 text-white flex-shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
              <ScrollArea className="flex-grow">
                <div className="space-y-2 pr-4">
                  {sessions.map(session => (
                    <div key={session.id} onClick={() => handleSelectSession(session)} className={cn("p-3 rounded-lg cursor-pointer border", activeSession?.id === session.id ? "bg-brand-orange-light border-brand-orange" : "hover:bg-gray-50")}>
                      {editingTitle?.id === session.id ? (
                        <div className="flex items-center space-x-2">
                          <Input 
                            value={editingTitle.title} 
                            onChange={e => setEditingTitle({ ...editingTitle, title: e.target.value })} 
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            className="h-8" 
                          />
                          <Button size="icon" className="h-8 w-8" onClick={handleUpdateTitle}><Check className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{session.title}</p>
                            <p className="text-xs text-gray-500">{session.service_names?.join(', ')} - {format(new Date(session.created_at), 'dd/MM/yy')}</p>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditingTitle({ id: session.id, title: session.title }); }}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteClick(session); }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            <div className="flex flex-col h-full">
              {activeSession ? (
                <>
                  <div className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{activeSession.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500">Dịch vụ:</p>
                        <div className="flex flex-wrap gap-1">
                          {activeSession.service_names?.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
                        </div>
                        <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="outline" className="h-6 w-6 ml-2" onClick={() => setTempSelectedServiceIds(activeSession.service_ids || [])}><Plus className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Thêm/Bớt dịch vụ</DialogTitle></DialogHeader>
                            <div className="py-4">
                              <Label>Chọn các dịch vụ cho cuộc trò chuyện này</Label>
                              <MultiSelectCombobox options={serviceOptions} selected={tempSelectedServiceIds} onChange={setTempSelectedServiceIds} placeholder="Chọn dịch vụ..." searchPlaceholder="Tìm dịch vụ..." emptyPlaceholder="Không tìm thấy." />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>Hủy</Button>
                              <Button onClick={handleUpdateSessionServices} className="bg-brand-orange hover:bg-brand-orange/90 text-white">Lưu</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium text-gray-600">Xưng hô:</Label>
                      <Select
                        value={customerSalutation}
                        onValueChange={(value: 'Anh' | 'Chị' | 'A/C') => {
                          if (value) handleSalutationChange(value);
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Chọn xưng hô" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Anh">Anh</SelectItem>
                          <SelectItem value="Chị">Chị</SelectItem>
                          <SelectItem value="A/C">A/C (Chưa rõ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ScrollArea className="flex-grow p-4 bg-gray-50/50">
                    <div className="space-y-6">
                      {messages.map((msg, index) => (
                        <div key={index} className={cn("flex flex-col gap-1", msg.role === 'user' ? 'items-end' : 'items-start')}>
                          <p className="text-xs text-gray-500 px-1">{msg.role === 'user' ? 'Khách hàng nhắn' : 'Bạn sẽ trả lời'}</p>
                          <div className={cn("flex items-center gap-2 w-full group", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.role === 'assistant' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-orange flex items-center justify-center text-white"><Bot className="h-5 w-5" /></div>}
                            <div className={cn("max-w-lg p-3 rounded-lg", msg.role === 'user' ? 'bg-brand-orange-light text-gray-800' : 'bg-white border')}>
                              <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                            </div>
                            {msg.role === 'assistant' && (
                                <div className="flex flex-col self-center space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-100 hover:bg-gray-200" onClick={() => handleCopy(msg.content)}>
                                        <Copy className="h-4 w-4 text-gray-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-orange-100 hover:bg-orange-200" onClick={() => handleRegenerateClick(msg)}>
                                        <RefreshCw className="h-4 w-4 text-brand-orange" />
                                    </Button>
                                </div>
                            )}
                            {msg.role === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center"><UserIcon className="h-5 w-5" /></div>}
                          </div>
                        </div>
                      ))}
                      {isReplying && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-orange flex items-center justify-center text-white"><Bot className="h-5 w-5" /></div>
                          <div className="max-w-lg p-3 rounded-lg bg-white border animate-pulse">Đang suy nghĩ...</div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t flex-shrink-0">
                    <div className="relative">
                      <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Dán tin nhắn của khách hàng vào đây..." className="pr-12" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={isReplying} />
                      <Button onClick={handleSendMessage} size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-brand-orange hover:bg-brand-orange/90" disabled={isReplying}><Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 text-gray-400" />
                  <p className="mt-4 font-medium">Chọn một cuộc trò chuyện hoặc tạo mới</p>
                  <p className="text-sm">Hãy chọn dịch vụ và bấm nút '+' để bắt đầu.</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này sẽ xóa vĩnh viễn cuộc trò chuyện "{sessionToDelete?.title}" và toàn bộ tin nhắn trong đó.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteSession} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Tạo lại câu trả lời</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="regenerate-direction">Nội dung cần chỉnh sửa (nếu có)</Label>
                <Textarea 
                    id="regenerate-direction" 
                    placeholder="VD: Viết ngắn gọn hơn, thêm yếu tố hài hước..." 
                    value={regenerateDirection} 
                    onChange={e => setRegenerateDirection(e.target.value)} 
                    className="mt-2" 
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleRegenerateMessage} className="bg-brand-orange hover:bg-brand-orange/90 text-white">Tạo lại</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerConsulting;