import PromptTemplateEditor from "@/components/settings/PromptTemplateEditor";
import QuoteCompanyInfo from "@/components/settings/QuoteCompanyInfo";

const ConfigQuote = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Báo giá</h1>
        <p className="text-gray-500 mt-1">
          Quản lý thông tin công ty và mẫu prompt cho tính năng tạo báo giá tự động.
        </p>
      </div>
      <div className="space-y-6">
        <QuoteCompanyInfo />
        <PromptTemplateEditor
          templateType="quote"
          title="Mẫu Prompt cho Tạo Báo giá"
          description="Cấu hình mẫu prompt mặc định cho chức năng 'Tạo báo giá'. AI sẽ sử dụng mẫu này để phân tích và tạo ra báo giá."
        />
      </div>
    </div>
  );
};

export default ConfigQuote;