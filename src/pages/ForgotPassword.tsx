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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Quên mật khẩu</h1>
            <p className="mt-2 text-gray-500">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>

            <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
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
        </div>
        <div className="hidden lg:flex flex-col bg-blue-600 p-8 sm:p-12 lg:p-16 text-white">
            <div className="flex-grow flex flex-col items-center justify-center text-center">
                <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-20" />
                <div className="mt-12 bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                    <p className="text-xl font-bold uppercase">
                        HỆ THỐNG QUẢN LÝ CỘNG TÁC VIÊN
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;