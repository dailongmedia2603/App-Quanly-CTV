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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "@/utils/toast";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const ApiKeysSettings = () => {
  // Gemini states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-pro-latest");
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<"success" | "error" | null>(null);

  // Facebook states
  const [facebookApiUrl, setFacebookApiUrl] = useState("");
  const [facebookApiToken, setFacebookApiToken] = useState("");
  const [isTestingFacebook, setIsTestingFacebook] = useState(false);
  const [facebookTestStatus, setFacebookTestStatus] = useState<"success" | "error" | null>(null);

  // Firecrawl states
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [isTestingFirecrawl, setIsTestingFirecrawl] = useState(false);
  const [firecrawlTestStatus, setFirecrawlTestStatus] = useState<"success" | "error" | null>(null);

  // General state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching settings:", error);
      } else if (data) {
        setGeminiApiKey(data.gemini_api_key || "");
        setGeminiModel(data.gemini_model || "gemini-2.5-pro-latest");
        setFacebookApiUrl(data.facebook_api_url || "");
        setFacebookApiToken(data.facebook_api_token || "");
        setFirecrawlApiKey(data.firecrawl_api_key || "");
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
        gemini_api_key: geminiApiKey,
        gemini_model: geminiModel,
        facebook_api_url: facebookApiUrl,
        facebook_api_token: facebookApiToken,
        firecrawl_api_key: firecrawlApiKey,
      });

    dismissToast(toastId);
    if (error) {
      showError(`Lỗi khi lưu: ${error.message}`);
    } else {
      showSuccess("Đã lưu cài đặt thành công!");
    }
    setIsSaving(false);
  };

  const handleTestGeminiConnection = async () => {
    if (!geminiApiKey) {
      showError("Vui lòng nhập Gemini API Key.");
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestStatus(null);
    const toastId = showLoading("Đang kiểm tra kết nối...");

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-gemini",
      { body: { apiKey: geminiApiKey, model: geminiModel } }
    );

    dismissToast(toastId);
    if (error) {
      showError(`Kiểm tra thất bại: ${error.message}`);
      setGeminiTestStatus("error");
    } else if (data.success) {
      showSuccess(data.message);
      setGeminiTestStatus("success");
    } else {
      showError(`Kiểm tra thất bại: ${data.message}`);
      setGeminiTestStatus("error");
    }
    setIsTestingGemini(false);
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
      showError(`Kiểm tra thất bại: ${error.message}`);
      setFacebookTestStatus("error");
    } else if (data.success) {
      showSuccess(data.message);
      setFacebookTestStatus("success");
    } else {
      showError(`Kiểm tra thất bại: ${data.message}`);
      setFacebookTestStatus("error");
    }
    setIsTestingFacebook(false);
  };

  const handleTestFirecrawlConnection = async () => {
    if (!firecrawlApiKey) {
      showError("Vui lòng nhập Firecrawl API Key.");
      return;
    }
    setIsTestingFirecrawl(true);
    setFirecrawlTestStatus(null);
    const toastId = showLoading("Đang kiểm tra kết nối Firecrawl...");

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-firecrawl",
      { body: { apiKey: firecrawlApiKey } }
    );

    dismissToast(toastId);
    if (error) {
      showError(`Kiểm tra thất bại: ${error.message}`);
      setFirecrawlTestStatus("error");
    } else if (data.success) {
      showSuccess(data.message);
      setFirecrawlTestStatus("success");
    } else {
      showError(`Kiểm tra thất bại: ${data.message}`);
      setFirecrawlTestStatus("error");
    }
    setIsTestingFirecrawl(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Gemini API</CardTitle>
            <CardDescription>Tích hợp với Gemini API của Google. Lấy key của bạn từ aistudio.google.com.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="gemini-api-key">API Key</Label><Input id="gemini-api-key" placeholder="Nhập Gemini API Key của bạn" value={geminiApiKey} onChange={(e) => { setGeminiApiKey(e.target.value); setGeminiTestStatus(null); }} /></div>
            <div className="space-y-2"><Label htmlFor="gemini-model">Model</Label><Select value={geminiModel} onValueChange={setGeminiModel}><SelectTrigger id="gemini-model"><SelectValue placeholder="Chọn một model" /></SelectTrigger><SelectContent><SelectItem value="gemini-2.5-pro-latest">Gemini 2.5 Pro</SelectItem><SelectItem value="gemini-2.5-flash-latest">Gemini 2.5 Flash</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between"><Button onClick={handleTestGeminiConnection} disabled={isTestingGemini || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">{isTestingGemini ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</Button><div>{geminiTestStatus === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4 mr-1.5" />Thành công</div>)}{geminiTestStatus === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Thất bại</div>)}</div></div>
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
            <div className="flex items-center justify-between"><Button onClick={handleTestFacebookConnection} disabled={isTestingFacebook || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">{isTestingFacebook ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</Button><div>{facebookTestStatus === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4 mr-1.5" />Thành công</div>)}{facebookTestStatus === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Thất bại</div>)}</div></div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>Firecrawl API</CardTitle>
          <CardDescription>Dùng để thu thập dữ liệu từ các website. Lấy key của bạn từ firecrawl.dev.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="firecrawl-api-key">API Key</Label><Input id="firecrawl-api-key" placeholder="Nhập Firecrawl API Key của bạn" value={firecrawlApiKey} onChange={(e) => { setFirecrawlApiKey(e.target.value); setFirecrawlTestStatus(null); }} /></div>
          <div className="flex items-center justify-between"><Button onClick={handleTestFirecrawlConnection} disabled={isTestingFirecrawl || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">{isTestingFirecrawl ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</Button><div>{firecrawlTestStatus === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 h-4 mr-1.5" />Thành công</div>)}{firecrawlTestStatus === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Thất bại</div>)}</div></div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isTestingFacebook || isTestingGemini || isTestingFirecrawl} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSaving ? "Đang lưu..." : "Lưu tất cả thay đổi"}</Button>
      </div>
    </div>
  );
};

export default ApiKeysSettings;