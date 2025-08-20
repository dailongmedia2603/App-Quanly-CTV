import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const UpdatePassword = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session) {
        showError("Không có phiên đặt lại mật khẩu hợp lệ. Vui lòng thử lại.");
        navigate('/login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [session, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Mật khẩu đã được cập nhật thành công!');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dotted-pattern flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-20 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-gray-500">Nhập mật khẩu mới của bạn.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu mới*</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold rounded-lg" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </div>
        </form>
      </div>
      <p className="mt-8 text-center text-xs text-gray-400">
        © 2024 DAILONG MEDIA. All Rights Reserved.
      </p>
    </div>
  );
};

export default UpdatePassword;