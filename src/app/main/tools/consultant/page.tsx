"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Markdown from 'react-markdown';
import { Database } from '@/types/supabase';

type Message = Database['public']['Tables']['consulting_messages']['Row'];

export default function ConsultantPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['consulting_session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consulting_sessions')
        .select('*, service_details(*, service_categories(*))')
        .eq('id', sessionId!)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: initialMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['consulting_messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consulting_messages')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (newMessages: Message[]) => {
      const userMessage = newMessages[newMessages.length - 1];
      
      const { data: safetyInstruction } = await supabase
        .from('ai_prompt_templates')
        .select('prompt')
        .eq('template_type', 'safety_instruction')
        .single();

      const { data, error } = await supabase.functions.invoke('generate-consulting-response', {
        body: {
          messages: newMessages,
          session_id: sessionId,
          system_prompt: safetyInstruction?.prompt || '',
        },
      });

      if (error) throw new Error(error.message);
      return data.newMessage as Message;
    },
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      queryClient.invalidateQueries({ queryKey: ['consulting_messages', sessionId] });
    },
    onError: (error: any) => {
      toast.error(`Lỗi từ AI: ${error.message}`);
      setMessages(prev => prev.slice(0, -1)); // Remove optimistic user message
    },
  });

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      session_id: sessionId,
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    sendMessage([...messages, userMessage]);
  };

  const isLoading = isLoadingSession || isLoadingMessages;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">
          {sessionData?.title || 'Tư vấn khách hàng'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sessionData?.service_details?.name || 'Đang tải...'}
        </p>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef as any}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role !== 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback><Sparkles size={16} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg p-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <Markdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      }}
                    >
                      {message.content}
                    </Markdown>
                  </div>
                  {message.role === 'user' && (
                     <Avatar className="w-8 h-8">
                      <AvatarFallback><User size={16} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isPending && (
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><Sparkles size={16} /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </main>
      <footer className="p-4 border-t">
        <div className="relative">
          <Textarea
            placeholder="Nhập tin nhắn của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="pr-12 min-h-[50px]"
            disabled={isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute top-1/2 right-3 -translate-y-1/2"
            onClick={handleSend}
            disabled={isPending || !input.trim()}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}