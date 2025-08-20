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
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

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
    <div className="min-h-screen bg-dotted-pattern flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-20 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Hệ thống Quản lý CTV</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
              <Checkbox
                id="remember-me"
                className="border-gray-400"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
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
      </div>
      <p className="mt-8 text-center text-xs text-gray-400">
        © 2024 DAILONG MEDIA. All Rights Reserved.
      </p>
    </div>
  );
};

export default Login;