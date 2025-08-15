import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { showError } from '@/utils/toast';

const Login = () => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      showError('Email hoặc mật khẩu không chính xác.');
    }
    // Navigation will be handled by the AuthContext's onAuthStateChange listener
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Left Panel: Form */}
        <div className="bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Đăng nhập</h1>
            <p className="mt-2 text-gray-500">Nhập Email và mật khẩu để đăng nhập</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-6">
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
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Checkbox id="remember-me" className="border-gray-400" />
                  <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Ghi nhớ trạng thái đăng nhập
                  </Label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold rounded-lg" disabled={loading}>
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Đăng ký tài khoản
              </Link>
            </p>

            <p className="mt-10 text-center text-xs text-gray-400">
              © 2024 DAILONG MEDIA. All Rights Reserved.
            </p>
          </div>
        </div>

        {/* Right Panel: Branding */}
        <div className="hidden lg:flex flex-col bg-blue-600 p-8 sm:p-12 lg:p-16 text-white">
            <div className="flex-grow flex flex-col items-center justify-center text-center">
                <img src="/logodailong-ngang.png" alt="Dailong Media Agency Logo" className="w-auto h-20" />
                <div className="mt-12 bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                    <p className="text-xl font-medium uppercase">
                        HỆ THỐNG QUẢN LÝ CỘNG TÁC VIÊN
                    </p>
                </div>
            </div>
            <div className="flex-shrink-0">
                <nav className="flex items-center justify-center space-x-6 text-sm">
                    <a href="#" className="hover:underline">Marketplace</a>
                    <a href="#" className="hover:underline">License</a>
                    <a href="#" className="hover:underline">Terms of Use</a>
                    <a href="#" className="hover:underline">Blog</a>
                </nav>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;