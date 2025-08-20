import VideoGuidesTab from "@/components/guide/VideoGuidesTab";
import CustomerFindingGuidesTab from "@/components/guide/CustomerFindingGuidesTab";
import { Video, Search, Lightbulb } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Guide = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Hướng dẫn "Bắt đầu công việc"</h1>
      </div>

      {/* BƯỚC 1 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg text-gray-800">BƯỚC 1:</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
              <li>
                Việc đầu tiên khi bắt đầu công việc bạn cần xem <strong>"Video hướng dẫn"</strong> bên dưới, để có thể hiểu chi tiết về các tính năng và ứng dụng trong việc tìm khách hàng.
              </li>
            </ul>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="video-guides" className="border border-orange-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b data-[state=open]:border-orange-100">
              <div className="flex items-center space-x-3">
                <Video className="h-6 w-6 text-brand-orange" />
                <h2 className="text-xl font-bold text-gray-800">Video hướng dẫn</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4">
              <VideoGuidesTab />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* BƯỚC 2 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg text-gray-800">BƯỚC 2:</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
              <li>
                Sau khi bạn xem các video hướng dẫn xong, có thể là bạn sẽ chưa thành thạo hoặc chưa quen sử dụng các công cụ.
              </li>
              <li>
                Vì vậy, bạn nên tự mình trải nghiệm nhiều lần cho từng tính năng như là: Tạo bài viết, tạo comment, tư vấn khách hàng,... để có thể sớm thành thạo sử dụng các công cụ nhằm hỗ trợ việc bán hàng tốt nhất.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* BƯỚC 3 */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg text-gray-800">BƯỚC 3:</h3>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
              <li>
                Sau khi bạn đã thành thạo sử dụng các công cụ hỗ trợ rồi. Thì lúc này là lúc bạn sẽ bắt đầu ứng dụng để bắt đầu tìm kiếm khách hàng.
              </li>
              <li>
                Dưới đây là hướng dẫn chi tiết cách tìm khách hàng một cách thực chiến. Khi bạn mới bắt đầu, bạn chỉ cần thực hiện theo giống các cách tìm khách hàng như trong video hướng dẫn nhé.
              </li>
            </ul>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="customer-finding-guides" className="border border-orange-200 rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b data-[state=open]:border-orange-100">
              <div className="flex items-center space-x-3">
                <Search className="h-6 w-6 text-brand-orange" />
                <h2 className="text-xl font-bold text-gray-800">Cách tìm khách hàng</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4">
              <CustomerFindingGuidesTab />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Guide;