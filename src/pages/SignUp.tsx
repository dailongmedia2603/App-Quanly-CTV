import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const SignUp = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dotted-pattern flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <img src="/logodailong-ngang.png" alt="Dailong Media Agency Logo" className="w-auto h-20 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Đăng ký tài khoản</h1>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
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

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu*</Label>
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
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
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

export default SignUp;