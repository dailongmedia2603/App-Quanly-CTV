import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { Landmark } from 'lucide-react';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  momo: string | null;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [momo, setMomo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Change password state
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, bank_name, bank_account_number, bank_account_name, momo')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      showError('Không thể tải thông tin tài khoản.');
      console.error(error);
    } else {
      setProfile(data);
      setFirstName(data?.first_name || '');
      setLastName(data?.last_name || '');
      setPhone(data?.phone || '');
      setBankName(data?.bank_name || '');
      setBankAccountNumber(data?.bank_account_number || '');
      setBankAccountName(data?.bank_account_name || '');
      setMomo(data?.momo || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    const toastId = showLoading('Đang cập nhật...');

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        momo: momo,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    dismissToast(toastId);

    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess('Cập nhật thông tin thành công!');
      setIsEditOpen(false);
      fetchProfile(); // Re-fetch profile to update UI
    }
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      showError('Mật khẩu không khớp.');
      return;
    }
    if (password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsChangingPassword(true);
    const toastId = showLoading('Đang đổi mật khẩu...');

    const { error } = await supabase.auth.updateUser({ password });

    dismissToast(toastId);
    if (error) {
      showError(`Đổi mật khẩu thất bại: ${error.message}`);
    } else {
      showSuccess('Đổi mật khẩu thành công!');
      setIsPasswordOpen(false);
      setPassword('');
      setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Đang tải...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-full">Không tìm thấy thông tin người dùng.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thông tin tài khoản</h1>
        <p className="text-gray-500 mt-1">Xem và chỉnh sửa thông tin cá nhân của bạn.</p>
      </div>
      <Card className="border-orange-200 max-w-2xl">
        <CardHeader>
          <CardTitle>Chi tiết tài khoản</CardTitle>
          <CardDescription>Đây là thông tin cá nhân và thanh toán của bạn trong hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Họ và tên</Label>
              <p className="font-semibold text-gray-800">{profile?.first_name || profile?.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Chưa cập nhật'}</p>
            </div>
            <div className="space-y-1">
              <Label>Số điện thoại</Label>
              <p className="font-semibold text-gray-800">{profile?.phone || 'Chưa cập nhật'}</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <p className="font-semibold text-gray-800">{user.email}</p>
          </div>
          
          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Landmark className="h-5 w-5 mr-2 text-brand-orange" />
              Thông tin thanh toán
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Ngân hàng</Label>
                <p className="font-semibold text-gray-800">{profile?.bank_name || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <Label>Số tài khoản</Label>
                <p className="font-semibold text-gray-800">{profile?.bank_account_number || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <Label>Tên tài khoản</Label>
                <p className="font-semibold text-gray-800">{profile?.bank_account_name || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <Label>Momo</Label>
                <p className="font-semibold text-gray-800">{profile?.momo || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">Chỉnh sửa</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                  <h4 className="font-medium">Thông tin cá nhân</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">Họ</Label>
                      <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Tên</Label>
                      <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <Separator className="my-6" />
                  <h4 className="font-medium">Thông tin thanh toán</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Ngân hàng</Label>
                      <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-account-number">Số tài khoản</Label>
                      <Input id="bank-account-number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-account-name">Tên tài khoản</Label>
                    <Input id="bank-account-name" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="momo">Momo</Label>
                    <Input id="momo" value={momo} onChange={(e) => setMomo(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                  <Button onClick={handleUpdateProfile} disabled={isSaving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSaving ? 'Đang lưu...' : 'Lưu'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Đổi mật khẩu</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đổi mật khẩu</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu mới</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Hủy</Button>
                  <Button onClick={handleChangePassword} disabled={isChangingPassword} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isChangingPassword ? 'Đang đổi...' : 'Xác nhận'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;