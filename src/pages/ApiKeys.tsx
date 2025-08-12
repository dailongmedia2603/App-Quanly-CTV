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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "@/utils/toast";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ApiKeys = () => {
  const { user } = useAuth();

  // Gemini states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-pro");
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState<
    "success" | "error" | null
  >(null);

  // Facebook states
  const [facebookApiUrl, setFacebookApiUrl] = useState("");
  const [facebookApiToken, setFacebookApiToken] = useState("");
  const [isTestingFacebook, setIsTestingFacebook] = useState(false);
  const [facebookTestStatus, setFacebookTestStatus] = useState<
    "success" | "error" | null
  >(null);

  // Firecrawl states
  const [firecrawlApiKey, setFirecrawlApiKey] = useState("");
  const [isTestingFirecrawl, setIsTestingFirecrawl] = useState(false);
  const [firecrawlTestStatus, setFirecrawlTestStatus] = useState<
    "success" | "error" | null
  >(null);

  // General state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_api_keys")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error fetching settings:", error);
      } else if (data) {
        setGeminiApiKey(data.gemini_api_key || "");
        setGeminiModel(data.gemini_model || "gemini-2.5-pro");
        setFacebookApiUrl(
          data.facebook_api_url || "http://api.akng.io.vn/graph/"
        );
        setFacebookApiToken(data.facebook_api_token || "");
        setFirecrawlApiKey(data.firecrawl_api_key || "");
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return showError("Bạn phải đăng nhập để lưu cài đặt.");
    setIsSaving(true);
    const toastId = showLoading("Saving settings...");

    const { error } = await supabase
      .from("user_api_keys")
      .upsert({
        user_id: user.id,
        gemini_api_key: geminiApiKey,
        gemini_model: geminiModel,
        facebook_api_url: facebookApiUrl,
        facebook_api_token: facebookApiToken,
        firecrawl_api_key: firecrawlApiKey,
        updated_at: new Date().toISOString(),
      })
      .select();

    dismissToast(toastId);
    if (error) {
      showError(`Error saving settings: ${error.message}`);
    } else {
      showSuccess("Settings saved successfully!");
    }
    setIsSaving(false);
  };

  const handleTestGeminiConnection = async () => {
    if (!geminiApiKey) {
      showError("Please enter a Gemini API Key first.");
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestStatus(null);
    const toastId = showLoading("Testing connection...");

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-gemini",
      {
        body: { apiKey: geminiApiKey, model: geminiModel },
      }
    );

    dismissToast(toastId);
    if (error) {
      showError(`Connection test failed: ${error.message}`);
      setGeminiTestStatus("error");
    } else if (data) {
      if (data.success) {
        showSuccess(data.message);
        setGeminiTestStatus("success");
      } else {
        showError(`Connection test failed: ${data.message}`);
        setGeminiTestStatus("error");
      }
    } else {
      showError("Connection test failed: An unknown error occurred.");
      setGeminiTestStatus("error");
    }
    setIsTestingGemini(false);
  };

  const handleTestFacebookConnection = async () => {
    if (!facebookApiUrl) {
      showError("Please enter a Facebook API URL first.");
      return;
    }
    if (!facebookApiToken) {
      showError("Please enter a Facebook API Token first.");
      return;
    }
    setIsTestingFacebook(true);
    setFacebookTestStatus(null);
    const toastId = showLoading("Testing Facebook connection...");

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-facebook",
      {
        body: { apiUrl: facebookApiUrl, token: facebookApiToken },
      }
    );

    dismissToast(toastId);
    if (error) {
      showError(`Connection test failed: ${error.message}`);
      setFacebookTestStatus("error");
    } else if (data) {
      if (data.success) {
        showSuccess(data.message);
        setFacebookTestStatus("success");
      } else {
        showError(`Connection test failed: ${data.message}`);
        setFacebookTestStatus("error");
      }
    } else {
      showError("Connection test failed: An unknown error occurred.");
      setFacebookTestStatus("error");
    }
    setIsTestingFacebook(false);
  };

  const handleTestFirecrawlConnection = async () => {
    if (!firecrawlApiKey) {
      showError("Please enter a Firecrawl API Key first.");
      return;
    }
    setIsTestingFirecrawl(true);
    setFirecrawlTestStatus(null);
    const toastId = showLoading("Testing Firecrawl connection...");

    const { data, error } = await supabase.functions.invoke(
      "test-ket-noi-firecrawl",
      {
        body: { apiKey: firecrawlApiKey },
      }
    );

    dismissToast(toastId);
    if (error) {
      showError(`Connection test failed: ${error.message}`);
      setFirecrawlTestStatus("error");
    } else if (data) {
      if (data.success) {
        showSuccess(data.message);
        setFirecrawlTestStatus("success");
      } else {
        showError(`Connection test failed: ${data.message}`);
        setFirecrawlTestStatus("error");
      }
    } else {
      showError("Connection test failed: An unknown error occurred.");
      setFirecrawlTestStatus("error");
    }
    setIsTestingFirecrawl(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-gray-500 mt-1">Manage your API integrations.</p>
      </div>

      <Tabs defaultValue="api-ai" className="w-full">
        <TabsList className="flex w-full rounded-lg border border-orange-200 p-1 bg-white">
          <TabsTrigger
            value="api-ai"
            className="flex-1 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light rounded-md"
          >
            API AI
          </TabsTrigger>
          <TabsTrigger
            value="api-facebook"
            className="flex-1 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light rounded-md"
          >
            API Facebook
          </TabsTrigger>
          <TabsTrigger
            value="api-firecrawl"
            className="flex-1 py-2 font-bold text-brand-orange data-[state=active]:bg-brand-orange-light rounded-md"
          >
            API Firecrawl
          </TabsTrigger>
        </TabsList>
        <TabsContent value="api-ai" className="pt-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Gemini API</CardTitle>
              <CardDescription>
                Integrate with Google's Gemini API. Get your key from
                aistudio.google.com.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">API Key</Label>
                <Input
                  id="gemini-api-key"
                  placeholder="Enter your Gemini API Key"
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    setGeminiTestStatus(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gemini-model">Model</Label>
                <Select value={geminiModel} onValueChange={setGeminiModel}>
                  <SelectTrigger id="gemini-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-pro">
                      Gemini 2.5 Pro
                    </SelectItem>
                    <SelectItem value="gemini-2.5-flash">
                      Gemini 2.5 Flash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    onClick={handleTestGeminiConnection}
                    disabled={isTestingGemini || isSaving}
                    variant="secondary"
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    {isTestingGemini ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isTestingGemini}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
                <div>
                  {geminiTestStatus === "success" && (
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Thành công
                    </div>
                  )}
                  {geminiTestStatus === "error" && (
                    <div className="flex items-center text-sm font-medium text-red-600">
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Thất bại
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api-facebook" className="pt-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Facebook API</CardTitle>
              <CardDescription>
                Configure the Facebook API integration using the provided
                third-party URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook-api-url">API URL</Label>
                <Input
                  id="facebook-api-url"
                  value={facebookApiUrl}
                  onChange={(e) => {
                    setFacebookApiUrl(e.target.value);
                    setFacebookTestStatus(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook-api-token">API Token</Label>
                <Input
                  id="facebook-api-token"
                  placeholder="Enter your Facebook API Token"
                  value={facebookApiToken}
                  onChange={(e) => {
                    setFacebookApiToken(e.target.value);
                    setFacebookTestStatus(null);
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    onClick={handleTestFacebookConnection}
                    disabled={isTestingFacebook || isSaving}
                    variant="secondary"
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    {isTestingFacebook ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isTestingFacebook}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
                <div>
                  {facebookTestStatus === "success" && (
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Thành công
                    </div>
                  )}
                  {facebookTestStatus === "error" && (
                    <div className="flex items-center text-sm font-medium text-red-600">
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Thất bại
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api-firecrawl" className="pt-6">
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Firecrawl API</CardTitle>
              <CardDescription>
                Integrate with Firecrawl for web scraping and crawling. Get your
                key from firecrawl.dev.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firecrawl-api-key">API Key</Label>
                <Input
                  id="firecrawl-api-key"
                  placeholder="Enter your Firecrawl API Key"
                  value={firecrawlApiKey}
                  onChange={(e) => {
                    setFirecrawlApiKey(e.target.value);
                    setFirecrawlTestStatus(null);
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    onClick={handleTestFirecrawlConnection}
                    disabled={isTestingFirecrawl || isSaving}
                    variant="secondary"
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    {isTestingFirecrawl ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isTestingFirecrawl}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
                <div>
                  {firecrawlTestStatus === "success" && (
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Thành công
                    </div>
                  )}
                  {firecrawlTestStatus === "error" && (
                    <div className="flex items-center text-sm font-medium text-red-600">
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Thất bại
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiKeys;