import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Mail, Link as LinkIcon, Unlink } from 'lucide-react';

const GmailConnection = () => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<{ email: string | null }>({ email: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('google_connected_email')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore error if no row is found
        showError("Không thể tải trạng thái kết nối Gmail.");
      } else if (data) {
        setConnection({ email: data.google_connected_email });
      }
      setLoading(false);
    };
    fetchConnectionStatus();
  }, [user]);

  const handleConnect = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/email-marketing`,
      },
    });
    if (error) {
      showError(`Lỗi kết nối: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    const toastId = showLoading("Đang ngắt kết nối...");
    const { error } = await supabase
      .from('profiles')
      .update({ google_refresh_token: null, google_connected_email: null })
      .eq('id', user.id);
    
    dismissToast(toastId);
    if (error) {
      showError("Ngắt kết nối thất bại.");
    } else {
      showSuccess("Đã ngắt kết nối tài khoản Gmail.");
      setConnection({ email: null });
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle>Kết nối Gmail</CardTitle>
        <CardDescription>Kết nối tài khoản Gmail của bạn để bắt đầu gửi email cho các chiến dịch.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Đang kiểm tra trạng thái...</p>
        ) : connection.email ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold">{connection.email}</p>
                <p className="text-xs text-green-700">Đã kết nối</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              <Unlink className="h-4 w-4 mr-2" />
              Ngắt kết nối
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">Bạn chưa kết nối tài khoản Gmail nào. Vui lòng kết nối để có thể gửi email.</p>
            <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700 text-white">
              <LinkIcon className="h-4 w-4 mr-2" />
              Kết nối với Google
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailConnection;