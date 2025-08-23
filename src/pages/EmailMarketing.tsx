import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, List, History } from "lucide-react";
import CreateEmailContentTab from "@/components/email-marketing/CreateEmailContentTab";
import SendEmailTab from "@/components/email-marketing/SendEmailTab";
import EmailListsTab from "@/components/email-marketing/EmailListsTab";
import EmailContentHistoryView from "@/components/email-marketing/EmailContentHistoryView";
import { Button } from '@/components/ui/button';

const EmailMarketing = () => {
  const [activeTab, setActiveTab] = useState('create-content');
  const [contentView, setContentView] = useState<'create' | 'history'>('create');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-gray-500 mt-1">
          Tạo, quản lý và gửi các chiến dịch email marketing.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl rounded-lg border border-orange-200 p-0 bg-white overflow-hidden">
            <TabsTrigger value="create-content" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
              <Mail className="h-5 w-5" />
              <span>Tạo nội dung Mail</span>
            </TabsTrigger>
            <TabsTrigger value="send-email" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
              <Send className="h-5 w-5" />
              <span>Gửi mail</span>
            </TabsTrigger>
            <TabsTrigger value="email-lists" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
              <List className="h-5 w-5" />
              <span>Danh sách mail</span>
            </TabsTrigger>
          </TabsList>
          {activeTab === 'create-content' && (
            <Button 
              onClick={() => setContentView(contentView === 'create' ? 'history' : 'create')}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              <History className="mr-2 h-4 w-4" />
              {contentView === 'create' ? 'Nội dung đã tạo' : 'Tạo nội dung mới'}
            </Button>
          )}
        </div>
        <TabsContent value="create-content" className="pt-6">
          {contentView === 'create' ? (
            <CreateEmailContentTab />
          ) : (
            <EmailContentHistoryView onBack={() => setContentView('create')} />
          )}
        </TabsContent>
        <TabsContent value="send-email" className="pt-6">
          <SendEmailTab />
        </TabsContent>
        <TabsContent value="email-lists" className="pt-6">
          <EmailListsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailMarketing;