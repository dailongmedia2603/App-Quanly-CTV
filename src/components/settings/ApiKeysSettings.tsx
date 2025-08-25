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
import { CheckCircle, XCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type KeyStatus = { status: 'success' | 'error' | 'testing' | null; message?: string };

const ApiKeysSettings = () => {
  // Gemini states
  const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>([""]);
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-pro");
  const [geminiKeyStatuses, setGeminiKeyStatuses] = useState<Array<KeyStatus | null>>([null]);
  const [isTestingGemini, setIsTestingGemini] = useState(false);

  // Facebook states
  const [facebookApiUrl, setFacebookApiUrl] = useState("");
  const [facebookApiToken, setFacebookApiToken] = useState("");
  const [isTestingFacebook, setIsTestingFacebook] = useState(false);
  const [facebookTestStatus, setFacebookTestStatus] = useState<"success" | "error" | null>(null);

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
        const keys = data.gemini_api_keys && data.gemini_api_keys.length > 0 ? data.gemini_api_keys : [""];
        setGeminiApiKeys(keys);
        setGeminiKeyStatuses(new Array(keys.length).fill(null));
        setGeminiModel(data.gemini_model || "gemini-1.5-pro");
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
        gemini_api_keys: geminiApiKeys.filter(key => key.trim() !== ''),
        gemini_model: geminiModel,
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

  const handleTestGeminiConnection = async () => {
    const keysToTest = geminiApiKeys.map((key, index) => ({ key, index })).filter(item => item.key.trim() !== '');
    if (keysToTest.length === 0) {
      showError("Vui lòng nhập ít nhất một Gemini API Key.");
      return;
    }

    setIsTestingGemini(true);
    const newStatuses: Array<KeyStatus | null> = [...geminiKeyStatuses];
    keysToTest.forEach(({ index }) => {
        newStatuses[index] = { status: 'testing' };
    });
    setGeminiKeyStatuses(newStatuses);

    const toastId = showLoading(`Đang kiểm tra ${keysToTest.length} key...`);

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-gemini",
      { body: { apiKeys: keysToTest.map(item => item.key), model: geminiModel } }
    );

    dismissToast(toastId);

    const finalStatuses = [...geminiApiKeys].map(() => null) as Array<KeyStatus | null>;

    if (error) {
        showError(`Kiểm tra thất bại: ${error.message}`);
        keysToTest.forEach(({ index }) => {
            finalStatuses[index] = { status: 'error', message: error.message };
        });
    } else {
        keysToTest.forEach(({ index }, resultIndex) => {
            const result = data.results[resultIndex];
            finalStatuses[index] = {
                status: result.success ? 'success' : 'error',
                message: result.message,
            };
        });
        const successCount = data.results.filter((r: any) => r.success).length;
        if (successCount === keysToTest.length) {
            showSuccess(`Tất cả ${successCount} key đều kết nối thành công!`);
        } else {
            showError(`${keysToTest.length - successCount}/${keysToTest.length} key kết nối thất bại. Vui lòng kiểm tra lại.`);
        }
    }
    setGeminiKeyStatuses(finalStatuses);
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

  const handleAddKey = () => {
    setGeminiApiKeys([...geminiApiKeys, ""]);
    setGeminiKeyStatuses([...geminiKeyStatuses, null]);
  };

  const handleRemoveKey = (index: number) => {
    if (geminiApiKeys.length > 1) {
      setGeminiApiKeys(geminiApiKeys.filter((_, i) => i !== index));
      setGeminiKeyStatuses(geminiKeyStatuses.filter((_, i) => i !== index));
    } else {
      setGeminiApiKeys([""]);
      setGeminiKeyStatuses([null]);
    }
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...geminiApiKeys];
    newKeys[index] = value;
    setGeminiApiKeys(newKeys);
    const newStatuses = [...geminiKeyStatuses];
    newStatuses[index] = null;
    setGeminiKeyStatuses(newStatuses);
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
            <div className="space-y-2">
              <Label>API Keys</Label>
              <TooltipProvider>
                {geminiApiKeys.map((key, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input placeholder={`Nhập Gemini API Key #${index + 1}`} value={key} onChange={(e) => handleKeyChange(index, e.target.value)} />
                    <div className="w-6 h-6 flex items-center justify-center">
                      {geminiKeyStatuses[index]?.status === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {geminiKeyStatuses[index]?.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {geminiKeyStatuses[index]?.status === 'error' && (
                        <Tooltip>
                          <TooltipTrigger>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{geminiKeyStatuses[index]?.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveKey(index)} className="text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </TooltipProvider>
              <Button variant="outline" size="sm" onClick={handleAddKey} className="flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Thêm Key</span></Button>
            </div>
            <div className="space-y-2"><Label htmlFor="gemini-model">Model</Label><Select value={geminiModel} onValueChange={setGeminiModel}><SelectTrigger id="gemini-model"><SelectValue placeholder="Chọn một model" /></SelectTrigger><SelectContent><SelectItem value="gemini-1.5-pro">Gemini 2.5 Pro</SelectItem><SelectItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem><SelectItem value="gemini-pro">Gemini 1.0 Pro (Ổn định)</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between"><Button onClick={handleTestGeminiConnection} disabled={isTestingGemini || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">{isTestingGemini ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</Button></div>
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
            <div className="flex items-center justify-between"><Button onClick={handleTestFacebookConnection} disabled={isTestingFacebook || isSaving} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700">{isTestingFacebook ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</Button><div>{facebookTestStatus === "success" && (<div className="flex items-center text-sm font-medium text-green-600"><CheckCircle className="w-4 w-4 mr-1.5" />Thành công</div>)}{facebookTestStatus === "error" && (<div className="flex items-center text-sm font-medium text-red-600"><XCircle className="w-4 w-4 mr-1.5" />Thất bại</div>)}</div></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isTestingFacebook || isTestingGemini} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSaving ? "Đang lưu..." : "Lưu tất cả thay đổi"}</Button>
      </div>
    </div>
  );
};

export default ApiKeysSettings;