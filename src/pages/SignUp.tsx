import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const AuthBranding = () => (
  <div className="hidden lg:flex flex-col items-center justify-center bg-blue-600 text-white p-12 rounded-2xl">
    <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-40 mx-auto" />
    <div className="mt-4 bg-white/20 backdrop-blur-sm py-2 px-6 rounded-lg">
      <h1 className="text-xl font-bold">HỆ THỐNG QUẢN LÝ CỘNG TÁC VIÊN</h1>
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      showError(`Lỗi đăng nhập Google: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-dotted-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg grid lg:grid-cols-2">
        <div className="lg:hidden text-center p-8 border-b border-gray-200">
          <img src="/logologin.png" alt="Dailong Media Agency Logo" className="w-auto h-16 mx-auto" />
        </div>
        <div className="p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900">Đăng ký tài khoản</h2>
          <p className="mt-2 text-gray-500">Tạo tài khoản mới để bắt đầu.</p>
          <form onSubmit={handleSignUp} className="mt-8 space-y-6">
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
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <GoogleIcon />
            <span className="ml-2">Đăng nhập với Google</span>
          </Button>

          <p className="mt-6 text-center text-sm text-gray-500">Đã có tài khoản? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Đăng nhập</Link></p>
          <p className="mt-8 text-center text-xs text-gray-400">© 2024 DAILONG MEDIA. All Rights Reserved.</p>
        </div>
        <AuthBranding />
      </div>
    </div>
  );
};

export default SignUp;