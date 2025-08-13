import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookText, Tags, Briefcase } from "lucide-react";
import ServicesTab from "@/components/documents/ServicesTab";
import PostTypesTab from "@/components/documents/PostTypesTab";
import DocumentsTab from "@/components/documents/DocumentsTab";

const Documents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tài liệu</h1>
        <p className="text-gray-500 mt-1">
          Quản lý và phân loại các tài liệu, mẫu nội dung của bạn.
        </p>
      </div>
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl rounded-lg border border-orange-200 p-0 bg-white overflow-hidden">
          <TabsTrigger value="documents" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
            <BookText className="h-5 w-5" />
            <span>Tài liệu</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
            <Briefcase className="h-5 w-5" />
            <span>Dịch vụ</span>
          </TabsTrigger>
          <TabsTrigger value="post_types" className="flex-1 flex items-center justify-center space-x-2 py-2.5 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold">
            <Tags className="h-5 w-5" />
            <span>Dạng bài</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="pt-6">
          <DocumentsTab />
        </TabsContent>
        <TabsContent value="services" className="pt-6">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="post_types" className="pt-6">
          <PostTypesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documents;