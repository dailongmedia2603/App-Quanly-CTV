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
  // Vertex AI states
  const [isTestingVertex, setIsTestingVertex] = useState(false);
  const [vertexTestStatus, setVertexTestStatus] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // Facebook states
  const [facebookApiUrl, setFacebookApiUrl] = useState("");
  const [facebookApiToken, setFacebookApiToken] = useState("");
  const [isTestingFacebook, setIsTestingFacebook] = useState(false);
  const [facebookTestStatus, setFacebookTestStatus] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // General state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("facebook_api_url, facebook_api_token")
        .eq("id", 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching settings:", error);
      } else if (data) {
        setFacebookApiUrl(data.facebook_api_url || "");
        setFacebookApiToken(data.facebook_api_token || "");
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
        facebook_api_url: facebookApiUrl,
        facebook_api_token: facebookApiToken,
      });

    dismissToast(toastId);
    if (error) {
      showError(`Lỗi khi lưu: ${error.message}`);
    } else {
      showSuccess("Đã lưu cài đặt thành công!");
    }
    setIsSaving(false);
  };

  const handleTestVertexConnection = async () => {
    setIsTestingVertex(true);
    setVertexTestStatus(null);
    const toastId = showLoading("Đang kiểm tra kết nối Vertex AI...");

    const { data, error } = await supabase.functions.invoke("test-vertex-ai");

    dismissToast(toastId);
    if (error) {
      // IMPROVEMENT: Extract detailed error message from the error context
      const detailedMessage = error.context?.message || error.message;
      const message = `Kiểm tra thất bại: ${detailedMessage}`;
      showError(message);
      setVertexTestStatus({ status: 'error', message: detailedMessage });
    } else {
      showSuccess(data.message);
      setVertexTestStatus({ status: data.success ? 'success' : 'error', message: data.message });
    }
    setIsTestingVertex(false);
  };

  const handleTestFacebookConnection = async () => {
    if (!facebookApiUrl || !facebookApiToken) {
      showError("Vui lòng nhập đầy đủ URL và Token của Facebook API.");
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
            <CardTitle>Vertex AI (Google Cloud)</CardTitle>
            <CardDescription>Kết nối với Vertex AI để sử dụng các model Gemini cấp doanh nghiệp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Ứng dụng sẽ tự động sử dụng các secret `GCP_PROJECT_ID`, `GCP_REGION`, và `GCP_SERVICE_ACCOUNT_KEY` bạn đã cấu hình trong Supabase.
            </p>
            <div className="flex items-center justify-between">
              <Button onClick={handleTestVertexConnection} disabled={isTestingVertex || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">
                {isTestingVertex ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {isTestingVertex ? "Đang kiểm tra..." : "Kiểm tra kết nối Vertex AI"}
              </Button>
              <div>
                {vertexTestStatus?.status === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4 mr-1.5" />Thành công</div>)}
                {vertexTestStatus?.status === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Thất bại</div>)}
              </div>
            </div>
            {vertexTestStatus?.status === 'error' && <p className="text-xs text-red-500">{vertexTestStatus.message}</p>}
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Facebook API</CardTitle>
            <CardDescription>Cấu hình tích hợp Facebook API sử dụng URL của bên thứ ba được cung cấp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="facebook-api-url">API URL</Label><Input id="facebook-api-url" value={facebookApiUrl} onChange={(e) => { setFacebookApiUrl(e.target.value); setFacebookTestStatus(null); }} /></div>
            <div className="space-y-2"><Label htmlFor="facebook-api-token">API Token</Label><Input id="facebook-api-token" placeholder="Nhập API Token của bạn" value={facebookApiToken} onChange={(e) => { setFacebookApiToken(e.target.value); setFacebookTestStatus(null); }} /></div>
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
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isTestingFacebook || isTestingVertex} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSaving ? "Đang lưu..." : "Lưu cài đặt Facebook"}</Button>
      </div>
    </div>
  );
};

export default ApiKeysSettings;