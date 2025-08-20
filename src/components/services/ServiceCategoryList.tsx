import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Folder, Plus, FileText, GripVertical, Pencil, Check, X, Trash2 } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ service: ServiceDetail, categoryId: string } | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'service', data: ServiceCategory | ServiceDetail } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sortedCategories = categories.map(cat => ({
      ...cat,
      service_details: [...cat.service_details].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    }));
    setLocalCategories(sortedCategories);
  }, [categories]);

  const handleEditServiceClick = (e: React.MouseEvent, service: ServiceDetail) => {
    e.stopPropagation();
    setEditingService({ id: service.id, name: service.name });
  };

  const handleCancelEditService = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingService(null);
  };

  const handleSaveService = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingService) return;
    const { error } = await supabase.from('service_details').update({ name: editingService.name }).eq('id', editingService.id);
    if (error) {
      showError("Cập nhật thất bại.");
    } else {
      showSuccess("Đã cập nhật tên dịch vụ.");
      onReorder();
    }
    setEditingService(null);
  };

  const handleEditCategoryClick = (e: React.MouseEvent, category: ServiceCategory) => {
    e.stopPropagation();
    setEditingCategory({ id: category.id, name: category.name });
  };

  const handleCancelEditCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(null);
  };

  const handleSaveCategory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingCategory) return;
    const { error } = await supabase.from('service_categories').update({ name: editingCategory.name }).eq('id', editingCategory.id);
    if (error) {
      showError("Cập nhật thất bại.");
    } else {
      showSuccess("Đã cập nhật tên danh mục.");
      onReorder();
    }
    setEditingCategory(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, type: 'category' | 'service', data: ServiceCategory | ServiceDetail) => {
    e.stopPropagation();
    setItemToDelete({ type, data });
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { type, data } = itemToDelete;
    const fromTable = type === 'category' ? 'service_categories' : 'service_details';
    const { error } = await supabase.from(fromTable).delete().eq('id', data.id);
    dismissToast(toastId);
    if (error) {
      showError("Xóa thất bại.");
    } else {
      showSuccess("Xóa thành công!");
      onReorder();
    }
    setIsDeleteAlertOpen(false);
    setItemToDelete(null);
    setIsSubmitting(false);
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
    <>
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Danh mục</h2>
          {canEdit && <Button size="sm" onClick={onAddCategory} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="h-4 w-4 mr-2" />Thêm mục</Button>}
        </div>
        <div className="flex-grow overflow-y-auto">
          <Accordion type="multiple" className="w-full" defaultValue={categories.map(c => c.id)}>
            {localCategories.map(category => (
              <AccordionItem value={category.id} key={category.id} className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline rounded-md hover:bg-gray-100 px-2 group">
                  {editingCategory?.id === category.id ? (
                    <div className="flex items-center space-x-2 w-full">
                      <Folder className="h-5 w-5 text-brand-orange flex-shrink-0" />
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="h-8 text-sm font-semibold"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSaveCategory}><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleCancelEditCategory}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Folder className="h-5 w-5 text-brand-orange" />
                        <span className="font-semibold text-gray-700">{category.name}</span>
                      </div>
                      {canEdit && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleEditCategoryClick(e, category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => handleDeleteClick(e, 'category', category)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={handleSaveService}><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={handleCancelEditService}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-grow">{service.name}</span>
                            {canEdit && (
                              <div className="flex items-center opacity-0 group-hover:opacity-100">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleEditServiceClick(e, service)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => handleDeleteClick(e, 'service', service)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa "{itemToDelete?.data.name}" không? Hành động này không thể hoàn tác.
              {itemToDelete?.type === 'category' && ' Tất cả dịch vụ con cũng sẽ bị xóa.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServiceCategoryList;