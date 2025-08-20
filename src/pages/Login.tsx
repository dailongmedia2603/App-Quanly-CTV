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

const AuthBranding = () => (
  <div className="hidden lg:flex flex-col items-center justify-center bg-blue-600 text-white p-12 rounded-2xl">
    <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-40 mx-auto" />
    <div className="mt-4 bg-white/20 backdrop-blur-sm py-2 px-6 rounded-lg">
      <h1 className="text-xl font-bold">HỆ THỐNG QUẢN LÝ CỘNG TÁC VIÊN</h1>
    </div>
  </div>
);

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
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dotted-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg grid lg:grid-cols-2">
        {/* Mobile Header */}
        <div className="lg:hidden text-center p-8 border-b border-gray-200">
          <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-16 mx-auto" />
        </div>

        <div className="p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-gray-500">Nhập Email và mật khẩu để đăng nhập</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu*</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} required placeholder="Tối thiểu 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center"><Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c as boolean)} /><Label htmlFor="remember-me" className="ml-2">Ghi nhớ trạng thái đăng nhập</Label></div>
              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">Quên mật khẩu?</Link>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">Chưa có tài khoản? <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">Đăng ký tài khoản</Link></p>
          <p className="mt-8 text-center text-xs text-gray-400">© 2024 DAILONG MEDIA. All Rights Reserved.</p>
        </div>
        <AuthBranding />
      </div>
    </div>
  );
};

export default Login;