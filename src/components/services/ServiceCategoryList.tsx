import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Folder, Plus, FileText } from "lucide-react";

export interface ServiceDetail {
  id: string;
  name: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  service_details: ServiceDetail[];
}

interface ServiceCategoryListProps {
  categories: ServiceCategory[];
  loading: boolean;
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
  onAddCategory: () => void;
  onAddService: (categoryId: string) => void;
  canEdit: boolean;
}

const ServiceCategoryList = ({ categories, loading, selectedServiceId, onSelectService, onAddCategory, onAddService, canEdit }: ServiceCategoryListProps) => {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Danh mục</h2>
        {canEdit && <Button size="sm" onClick={onAddCategory} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="h-4 w-4 mr-2" />Thêm mục</Button>}
      </div>
      <div className="flex-grow overflow-y-auto">
        <Accordion type="multiple" className="w-full" defaultValue={categories.map(c => c.id)}>
          {categories.map(category => (
            <AccordionItem value={category.id} key={category.id} className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline rounded-md hover:bg-gray-100 px-2">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-brand-orange" />
                  <span className="font-medium text-gray-700">{category.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pt-1 pb-2">
                <div className="border-l-2 border-orange-100 pl-4 space-y-1">
                  {category.service_details.map(service => (
                    <button
                      key={service.id}
                      onClick={() => onSelectService(service.id)}
                      className={cn(
                        "w-full text-left flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-brand-orange-light",
                        selectedServiceId === service.id && "bg-brand-orange-light text-brand-orange font-semibold"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{service.name}</span>
                    </button>
                  ))}
                  {canEdit && (
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-gray-500" onClick={() => onAddService(category.id)}>
                      <Plus className="h-3 w-3 mr-2" />Thêm dịch vụ con
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default ServiceCategoryList;