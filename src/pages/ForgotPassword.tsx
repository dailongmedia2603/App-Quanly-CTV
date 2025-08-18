import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/utils/toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dotted-pattern flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <img src="/logodailong-ngang.png" alt="Dailong Media Agency Logo" className="w-auto h-20 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Quên mật khẩu</h1>
          <p className="mt-2 text-gray-500">Nhập email để nhận hướng dẫn.</p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold">Email*</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold rounded-lg" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Nhớ mật khẩu rồi?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Đăng nhập
          </Link>
        </p>
      </div>
      <p className="mt-8 text-center text-xs text-gray-400">
        © 2024 DAILONG MEDIA. All Rights Reserved.
      </p>
    </div>
  );
};

export default ForgotPassword;