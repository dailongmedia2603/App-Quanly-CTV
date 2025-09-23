import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "@/utils/toast";
import { CheckCircle, XCircle, Loader2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const ApiKeysSettings = () => {
  // MultiApp AI states
  const [multiappaiApiUrl, setMultiappaiApiUrl] = useState("");
  const [multiappaiApiKey, setMultiappaiApiKey] = useState("");
  const [isTestingMultiAppAI, setIsTestingMultiAppAI] = useState(false);
  const [multiAppAITestStatus, setMultiAppAITestStatus] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // Facebook states
  const [facebookApiUrl, setFacebookApiUrl] = useState("");
  const [facebookApiToken, setFacebookApiToken] = useState("");
  const [isTestingFacebook, setIsTestingFacebook] = useState(false);
  const [facebookTestStatus, setFacebookTestStatus] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // User Facebook API states
  const [userFacebookApiUrl, setUserFacebookApiUrl] = useState("");
  const [userFacebookApiKey, setUserFacebookApiKey] = useState("");

  // General state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("multiappai_api_url, multiappai_api_key, facebook_api_url, facebook_api_token, user_facebook_api_url, user_facebook_api_key")
        .eq("id", 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching settings:", error);
      } else if (data) {
        setMultiappaiApiUrl(data.multiappai_api_url || "");
        setMultiappaiApiKey(data.multiappai_api_key || "");
        setFacebookApiUrl(data.facebook_api_url || "");
        setFacebookApiToken(data.facebook_api_token || "");
        setUserFacebookApiUrl(data.user_facebook_api_url || "");
        setUserFacebookApiKey(data.user_facebook_api_key || "");
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading("Đang lưu cài đặt...");

    const { error } = await supabase
      .from("app_settings")
      .upsert({
        id: 1,
        multiappai_api_url: multiappaiApiUrl,
        multiappai_api_key: multiappaiApiKey,
        facebook_api_url: facebookApiUrl,
        facebook_api_token: facebookApiToken,
        user_facebook_api_url: userFacebookApiUrl,
        user_facebook_api_key: userFacebookApiKey,
      });

    dismissToast(toastId);
    if (error) {
      showError(`Lỗi khi lưu: ${error.message}`);
    } else {
      showSuccess("Đã lưu cài đặt thành công!");
    }
    setIsSaving(false);
  };

  const handleTestMultiAppAIConnection = async () => {
    if (!multiappaiApiUrl || !multiappaiApiKey) {
      showError("Vui lòng nhập đầy đủ URL và API Key.");
      return;
    }
    setIsTestingMultiAppAI(true);
    setMultiAppAITestStatus(null);
    const toastId = showLoading("Đang kiểm tra kết nối MultiApp AI...");

    const { data, error } = await supabase.functions.invoke(
      "test-multiappai-connection",
      { body: { apiUrl: multiappaiApiUrl, apiKey: multiappaiApiKey } }
    );

    dismissToast(toastId);
    if (error) {
      const message = `Kiểm tra thất bại: ${error.message}`;
      showError(message);
      setMultiAppAITestStatus({ status: "error", message });
    } else {
      if (data.success) showSuccess(data.message);
      else showError(`Kiểm tra thất bại: ${data.message}`);
      setMultiAppAITestStatus({ status: data.success ? "success" : "error", message: data.message });
    }
    setIsTestingMultiAppAI(false);
  };

  const handleTestFacebookConnection = async () => {
    if (!facebookApiUrl || !facebookApiToken) {
      showError("Vui lòng nhập đầy đủ URL và Access Token của Facebook API.");
      return;
    }
    setIsTestingFacebook(true);
    setFacebookTestStatus(null);
    const toastId = showLoading("Đang kiểm tra kết nối Facebook...");

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-facebook",
      { body: { apiUrl: facebookApiUrl, token: facebookApiToken } }
    );

    dismissToast(toastId);
    if (error) {
      const message = `Kiểm tra thất bại: ${error.message}`;
      showError(message);
      setFacebookTestStatus({ status: "error", message });
    } else {
      if (data.success) showSuccess(data.message);
      else showError(`Kiểm tra thất bại: ${data.message}`);
      setFacebookTestStatus({ status: data.success ? "success" : "error", message: data.message });
    }
    setIsTestingFacebook(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>MultiApp AI</CardTitle>
            <CardDescription>Cấu hình API Key để sử dụng các model AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="multiappai-api-url">API URL</Label><Input id="multiappai-api-url" value={multiappaiApiUrl} onChange={(e) => { setMultiappaiApiUrl(e.target.value); setMultiAppAITestStatus(null); }} /></div>
            <div className="space-y-2"><Label htmlFor="multiappai-api-key">API Key</Label><Input id="multiappai-api-key" type="password" placeholder="sk-..." value={multiappaiApiKey} onChange={(e) => { setMultiappaiApiKey(e.target.value); setMultiAppAITestStatus(null); }} /></div>
            <div className="flex items-center justify-between">
              <Button onClick={handleTestMultiAppAIConnection} disabled={isTestingMultiAppAI || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">
                {isTestingMultiAppAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {isTestingMultiAppAI ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
              </Button>
              <div>
                {multiAppAITestStatus?.status === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4 mr-1.5" />Thành công</div>)}
                {multiAppAITestStatus?.status === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Thất bại</div>)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Facebook API (Quét tự động)</CardTitle>
            <CardDescription>Cấu hình tích hợp Facebook API để quét chiến dịch tự động.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="facebook-api-url">API URL</Label><Input id="facebook-api-url" value={facebookApiUrl} onChange={(e) => { setFacebookApiUrl(e.target.value); setFacebookTestStatus(null); }} /></div>
            <div className="space-y-2"><Label htmlFor="facebook-api-token">Access Token</Label><Input id="facebook-api-token" placeholder="Nhập Access Token của bạn" value={facebookApiToken} onChange={(e) => { setFacebookApiToken(e.target.value); setFacebookTestStatus(null); }} /></div>
            <div className="flex items-center justify-between">
              <Button onClick={handleTestFacebookConnection} disabled={isTestingFacebook || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">
                {isTestingFacebook ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {isTestingFacebook ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
              </Button>
              <div>
                {facebookTestStatus?.status === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4 mr-1.5" />Thành công</div>)}
                {facebookTestStatus?.status === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Thất bại</div>)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 lg:col-span-2">
          <CardHeader>
            <CardTitle>Facebook API (Hành động thủ công)</CardTitle>
            <CardDescription>Cấu hình API để thực hiện các hành động thủ công như đăng comment. API này sẽ sử dụng cookie của từng người dùng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="user-facebook-api-url">API URL</Label><Input id="user-facebook-api-url" value={userFacebookApiUrl} onChange={(e) => setUserFacebookApiUrl(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="user-facebook-api-key">API Key</Label><Input id="user-facebook-api-key" type="password" placeholder="Nhập API Key" value={userFacebookApiKey} onChange={(e) => setUserFacebookApiKey(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isTestingFacebook || isTestingMultiAppAI} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSaving ? "Đang lưu..." : "Lưu tất cả cài đặt"}</Button>
      </div>
    </div>
  );
};

export default ApiKeysSettings;