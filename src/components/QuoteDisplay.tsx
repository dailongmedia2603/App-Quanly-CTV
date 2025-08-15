import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Separator } from './ui/separator';

interface QuoteDisplayProps {
  content: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string;
}

const QuoteDisplay = ({ content }: QuoteDisplayProps) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('quote_company_name, quote_company_address, quote_company_email, quote_company_phone, quote_logo_url')
        .single();
      
      if (data) {
        setCompanyInfo({
          name: data.quote_company_name || 'Công ty TNHH Listen PRO',
          address: data.quote_company_address || 'Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM',
          email: data.quote_company_email || 'contact@listenpro.vn',
          phone: data.quote_company_phone || '0123 456 789',
          logoUrl: data.quote_logo_url || '/logolistenpro.png',
        });
      }
    };
    fetchCompanyInfo();
  }, []);

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <header className="flex justify-between items-start mb-8">
        <div>
          <img src={companyInfo?.logoUrl} alt="Logo công ty" className="h-16 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">{companyInfo?.name}</h2>
          <p className="text-sm text-gray-500">
            {companyInfo?.address}<br />
            Email: {companyInfo?.email} | Điện thoại: {companyInfo?.phone}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">Báo Giá</h1>
        </div>
      </header>
      <Separator className="my-8" />
      <main className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-800 prose-table:border prose-th:bg-gray-50">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </main>
    </div>
  );
};

export default QuoteDisplay;