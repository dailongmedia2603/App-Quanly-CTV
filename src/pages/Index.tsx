"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Chào mừng đến với Ứng dụng của bạn!</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-prose">
        Đây là trang chủ của ứng dụng. Bạn có thể điều hướng đến các tính năng khác từ đây.
      </p>
      <div className="flex space-x-4">
        <Link to="/email-marketing/create-content">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Tạo Nội Dung Email Mới
          </Button>
        </Link>
        {/* Add more links to other features here */}
      </div>
    </div>
  );
}