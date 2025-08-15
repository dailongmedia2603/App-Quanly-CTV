import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Separator } from './ui/separator';

interface QuoteDisplayProps {
  content: string;
}

const QuoteDisplay = ({ content }: QuoteDisplayProps) => {
  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <header className="flex justify-between items-start mb-8">
        <div>
          <img src="/logolistenpro.png" alt="Listen Pro Logo" className="h-16 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800">Công ty TNHH Listen PRO</h2>
          <p className="text-sm text-gray-500">
            Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM<br />
            Email: contact@listenpro.vn | Điện thoại: 0123 456 789
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