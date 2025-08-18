import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Folder, Plus, FileText, GripVertical, Pencil, Check, X } from "lucide-react";
import { showError, showSuccess } from '@/utils/toast';

export interface ServiceDetail {
  id: string;
  name: string;
  position: number | null;
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
  onReorder: () => void;
}

const ServiceCategoryList = ({ categories, loading, selectedServiceId, onSelectService, onAddCategory, onAddService, canEdit, onReorder }: ServiceCategoryListProps) => {
  const [localCategories, setLocalCategories] = useState<ServiceCategory[]>([]);
  const [editingService, setEditingService] = useState<{ id: string; name: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ service: ServiceDetail, categoryId: string } | null>(null);

  useEffect(() => {
    const sortedCategories = categories.map(cat => ({
      ...cat,
      service_details: [...cat.service_details].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    }));
    setLocalCategories(sortedCategories);
  }, [categories]);

  const handleEditClick = (e: React.MouseEvent, service: ServiceDetail) => {
    e.stopPropagation();
    setEditingService({ id: service.id, name: service.name });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingService(null);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingService) return;
    const { error } = await supabase.from('service_details').update({ name: editingService.name }).eq('id', editingService.id);
    if (error) {
      showError("Cập nhật thất bại.");
    } else {
      showSuccess("Đã cập nhật tên dịch vụ.");
      onReorder(); // Refetch all data
    }
    setEditingService(null);
  };

  const handleDragStart = (e: React.DragEvent, service: ServiceDetail, categoryId: string) => {
    setDraggedItem({ service, categoryId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetService: ServiceDetail, categoryId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.categoryId !== categoryId || draggedItem.service.id === targetService.id) {
      setDraggedItem(null);
      return;
    }

    const categoryIndex = localCategories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    let services = [...localCategories[categoryIndex].service_details];
    const draggedIndex = services.findIndex(s => s.id === draggedItem.service.id);
    const targetIndex = services.findIndex(s => s.id === targetService.id);

    const [removed] = services.splice(draggedIndex, 1);
    services.splice(targetIndex, 0, removed);

    const newCategories = [...localCategories];
    newCategories[categoryIndex].service_details = services;
    setLocalCategories(newCategories);

    const servicesToUpdate = services.map((service, index) => ({
      id: service.id,
      position: index,
    }));

    const { error } = await supabase.functions.invoke('update-service-positions', { body: { services: servicesToUpdate } });
    if (error) {
      showError("Lỗi khi sắp xếp. Đang tải lại...");
      onReorder();
    } else {
      showSuccess("Đã cập nhật thứ tự.");
    }
    setDraggedItem(null);
  };

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
          {localCategories.map(category => (
            <AccordionItem value={category.id} key={category.id} className="border-b-0">
              <AccordionTrigger className="py-2 hover:no-underline rounded-md hover:bg-gray-100 px-2">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-brand-orange" />
                  <span className="font-semibold text-gray-700">{category.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pt-1 pb-2">
                <div className="border-l-2 border-orange-100 pl-4 space-y-1">
                  {category.service_details.map(service => (
                    <div
                      key={service.id}
                      draggable={canEdit}
                      onDragStart={e => handleDragStart(e, service, category.id)}
                      onDragOver={handleDragOver}
                      onDrop={e => handleDrop(e, service, category.id)}
                      onClick={() => editingService?.id !== service.id && onSelectService(service.id)}
                      className={cn(
                        "w-full text-left flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm text-gray-600 group",
                        canEdit && "cursor-grab",
                        !canEdit && "cursor-pointer",
                        selectedServiceId === service.id && "bg-brand-orange-light text-brand-orange font-semibold",
                        draggedItem?.service.id === service.id && "opacity-50"
                      )}
                    >
                      {canEdit && <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                      {editingService?.id === service.id ? (
                        <div className="flex-grow flex items-center space-x-1">
                          <Input 
                            value={editingService.name} 
                            onChange={e => setEditingService({...editingService, name: e.target.value})} 
                            className="h-7 text-sm"
                            onClick={e => e.stopPropagation()}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={handleSaveEdit}><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-grow">{service.name}</span>
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => handleEditClick(e, service)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
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