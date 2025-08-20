import VideoGuidesTab from "@/components/guide/VideoGuidesTab";
import CustomerFindingGuidesTab from "@/components/guide/CustomerFindingGuidesTab";
import { Video, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Guide = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Hướng dẫn "Bắt đầu công việc"</h1>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-4">
        <AccordionItem value="video-guides" className="border border-orange-200 rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b data-[state=open]:border-orange-100">
            <div className="flex items-center space-x-3">
              <Video className="h-6 w-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-gray-800">Video hướng dẫn</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <VideoGuidesTab />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="customer-finding-guides" className="border border-orange-200 rounded-lg bg-white shadow-sm">
          <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b data-[state=open]:border-orange-100">
            <div className="flex items-center space-x-3">
              <Search className="h-6 w-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-gray-800">Cách tìm khách hàng</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <CustomerFindingGuidesTab />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Guide;