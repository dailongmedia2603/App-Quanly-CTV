import { useState, useEffect, useRef } from 'react';
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

interface Service {
  id: string;
  name: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  service_id: string;
  service_name?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

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

  const fetchServicesAndSessions = async () => {
    const [servicesRes, sessionsRes] = await Promise.all([
      supabase.from('document_services').select('id, name'),
      supabase.from('consulting_sessions').select('*, service:document_services(name)').order('created_at', { ascending: false })
    ]);

    if (servicesRes.error) showError("Không thể tải dịch vụ.");
    else setServices(servicesRes.data as Service[]);

    if (sessionsRes.error) showError("Không thể tải lịch sử chat.");
    else {
      const formattedSessions = sessionsRes.data.map(s => ({ ...s, service_name: s.service?.name || 'Không rõ' }));
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
    setSelectedServiceId(session.service_id);
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
      service_id: selectedServiceId,
      title: newTitle
    }).select('*, service:document_services(name)').single();

    if (error) {
      showError("Không thể tạo cuộc trò chuyện mới.");
    } else {
      const formattedSession = { ...data, service_name: data.service?.name || 'Không rõ' };
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
        serviceId: activeSession.service_id,
        messages: [...messages, customerMessage].map(({ role, content }) => ({ role, content }))
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
    setIsDeleteAlertOpen(false);
    setSessionToDelete(null);
  };

  const handleCopy = (content: string) => {
    // Remove bold markers (like **) but keep the content and list markers.
    const plainText = content.replace(/(\*\*|__)(.*?)\1/g, '$2');
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
              serviceId: activeSession.service_id,
              messages: historyForPrompt.map(({ role, content }) => ({ role, content })),
              regenerateDirection: regenerateDirection,
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
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={!!activeSession}>
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
                            <p className="text-xs text-gray-500">{session.service_name} - {format(new Date(session.created_at), 'dd/MM/yy')}</p>
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
                  <div className="p-4 border-b flex-shrink-0">
                    <h3 className="font-bold">{activeSession.title}</h3>
                    <p className="text-sm text-gray-500">Dịch vụ: {services.find(s => s.id === activeSession.service_id)?.name}</p>
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