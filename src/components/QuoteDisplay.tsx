import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Building, Mail, MapPin, Phone } from 'lucide-react';

interface QuoteItem {
  category: string;
  kpi: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteData {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  clientInfo: { name: string; address: string };
  items: QuoteItem[];
  summary: {
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  };
  totalInWords: string;
  terms: string;
  notes: string;
}

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

const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return 'N/A';
  return new Intl.NumberFormat('vi-VN').format(value);
};

const QuoteDisplay = ({ content }: QuoteDisplayProps) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      const { data } = await supabase
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

  let quoteData: QuoteData | null = null;
  try {
    quoteData = JSON.parse(content);
  } catch (e) {
    return (
      <div className="text-center text-red-500 p-8">
        <p>Lỗi hiển thị báo giá.</p>
        <p className="text-xs text-gray-500">AI có thể đã trả về định dạng không hợp lệ.</p>
      </div>
    );
  }

  if (!quoteData) return null;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm font-sans text-gray-800">
      <header className="flex justify-between items-start mb-6">
        <div>
          {companyInfo?.logoUrl && <img src={companyInfo.logoUrl} alt="Logo công ty" className="h-16 mb-4" />}
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Building className="h-4 w-4 text-brand-orange" />
            <span>{companyInfo?.name}</span>
          </h2>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <p className="flex items-center space-x-2"><MapPin className="h-3 w-3" /><span>{companyInfo?.address}</span></p>
            <p className="flex items-center space-x-2"><Mail className="h-3 w-3" /><span>{companyInfo?.email}</span></p>
            <p className="flex items-center space-x-2"><Phone className="h-3 w-3" /><span>{companyInfo?.phone}</span></p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-white bg-brand-orange px-6 py-2 rounded-md uppercase tracking-wider">Báo Giá</h1>
          <p className="text-sm text-gray-500 mt-2">Số: {quoteData.quoteNumber}</p>
          <p className="text-sm text-gray-500">Ngày: {quoteData.quoteDate}</p>
        </div>
      </header>

      <div className="bg-brand-orange-light border border-orange-200 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-semibold text-gray-600">Kính gửi:</h3>
        <p className="text-base font-bold text-gray-900">{quoteData.clientInfo.name}</p>
      </div>

      <main>
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-orange-light border-b-2 border-brand-orange hover:bg-brand-orange-light">
                <TableHead className="w-[35%] text-brand-orange font-bold uppercase">DANH MỤC</TableHead>
                <TableHead className="text-brand-orange font-bold uppercase">KPI</TableHead>
                <TableHead className="text-center text-brand-orange font-bold uppercase">SỐ LƯỢNG</TableHead>
                <TableHead className="text-right text-brand-orange font-bold uppercase">ĐƠN GIÁ (VNĐ)</TableHead>
                <TableHead className="text-right text-brand-orange font-bold uppercase">THÀNH TIỀN (VNĐ)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteData.items.map((item, index) => (
                <TableRow key={index} className="border-b border-orange-100 last:border-b-0">
                  <TableCell className="font-semibold">{item.category}</TableCell>
                  <TableCell className="text-sm text-gray-600">{item.kpi}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <footer className="mt-8">
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Tổng tiền:</span><span className="font-semibold">{formatCurrency(quoteData.summary.subtotal)} VNĐ</span></div>
            {quoteData.summary.vatAmount > 0 && <div className="flex justify-between"><span className="text-gray-600">Thuế VAT ({quoteData.summary.vatRate * 100}%):</span><span className="font-semibold">{formatCurrency(quoteData.summary.vatAmount)} VNĐ</span></div>}
            <Separator />
            <div className="flex justify-between text-lg font-bold"><span className="text-gray-900">TỔNG TIỀN SAU THUẾ:</span><span className="text-brand-orange">{formatCurrency(quoteData.summary.total)} VNĐ</span></div>
          </div>
        </div>
        <p className="text-sm font-semibold mt-2">Bằng chữ: <span className="italic font-normal">{quoteData.totalInWords}</span></p>
        
        <Separator className="my-6 border-orange-100" />

        <div className="grid grid-cols-2 gap-8 text-xs text-gray-600">
          <div>
            <h4 className="font-bold text-sm text-gray-800 mb-2 uppercase">ĐIỀU KHOẢN THANH TOÁN</h4>
            <p className="whitespace-pre-wrap">{quoteData.terms}</p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-800 mb-2 uppercase">GHI CHÚ</h4>
            <p className="whitespace-pre-wrap">{quoteData.notes}</p>
          </div>
        </div>

        <div className="flex justify-end mt-16">
            <div className="text-center">
                <p className="font-semibold">ĐẠI DIỆN CÔNG TY</p>
                <div className="h-16"></div>
                <p className="font-semibold">{companyInfo?.name}</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default QuoteDisplay;