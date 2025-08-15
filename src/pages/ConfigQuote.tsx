import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PromptTemplateEditor from "@/components/settings/PromptTemplateEditor";
import QuoteCompanyInfo from "@/components/settings/QuoteCompanyInfo";
import { Building, Bot } from "lucide-react";

const ConfigQuote = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cấu hình Báo giá</h1>
        <p className="text-gray-500 mt-1">
          Quản lý thông tin công ty và mẫu prompt cho tính năng tạo báo giá tự động.
        </p>
      </div>
      <Accordion type="multiple" className="w-full space-y-4">
        <AccordionItem value="company-info" className="border border-orange-200 rounded-lg bg-white overflow-hidden">
          <AccordionTrigger className="p-4 hover:no-underline text-left">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-brand-orange flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800">Thông tin công ty trên báo giá</h3>
                <p className="text-sm text-gray-500 font-normal">Cấu hình logo và thông tin sẽ hiển thị trên đầu mỗi báo giá được tạo ra.</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <QuoteCompanyInfo />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="prompt-template" className="border border-orange-200 rounded-lg bg-white overflow-hidden">
          <AccordionTrigger className="p-4 hover:no-underline text-left">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6 text-brand-orange flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800">Mẫu Prompt cho Tạo Báo giá</h3>
                <p className="text-sm text-gray-500 font-normal">Cấu hình mẫu prompt mặc định cho chức năng 'Tạo báo giá'.</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <PromptTemplateEditor templateType="quote" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ConfigQuote;