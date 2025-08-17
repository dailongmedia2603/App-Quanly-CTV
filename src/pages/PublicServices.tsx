import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ServiceCategoryList, { ServiceCategory } from '@/components/services/ServiceCategoryList';
import ServiceContentDisplay from '@/components/services/ServiceContentDisplay';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

const PublicServices = () => {
  const { roles } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

  const isSuperAdmin = roles.includes('Super Admin');

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_categories')
      .select('*, service_details(id, name)')
      .order('created_at', { ascending: true });

    if (error) {
      showError("Không thể tải danh mục dịch vụ.");
    } else {
      setCategories(data as ServiceCategory[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const toastId = showLoading("Đang thêm danh mục...");
    const { error } = await supabase.from('service_categories').insert({ name: newCategoryName });
    dismissToast(toastId);
    if (error) {
      showError("Thêm thất bại.");
    } else {
      showSuccess("Thêm danh mục thành công!");
      setIsCategoryDialogOpen(false);
      setNewCategoryName('');
      fetchData();
    }
  };

  const handleAddService = async () => {
    if (!newServiceName.trim() || !parentCategoryId) return;
    const toastId = showLoading("Đang thêm dịch vụ...");
    const { error } = await supabase.from('service_details').insert({ name: newServiceName, category_id: parentCategoryId });
    dismissToast(toastId);
    if (error) {
      showError("Thêm thất bại.");
    } else {
      showSuccess("Thêm dịch vụ thành công!");
      setIsServiceDialogOpen(false);
      setNewServiceName('');
      fetchData();
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border border-orange-200 bg-white">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <ServiceCategoryList
              categories={categories}
              loading={loading}
              selectedServiceId={selectedServiceId}
              onSelectService={setSelectedServiceId}
              onAddCategory={() => setIsCategoryDialogOpen(true)}
              onAddService={(categoryId) => {
                setParentCategoryId(categoryId);
                setIsServiceDialogOpen(true);
              }}
              canEdit={isSuperAdmin}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            <ServiceContentDisplay 
              serviceId={selectedServiceId} 
              canEdit={isSuperAdmin}
              onDataChange={fetchData}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm danh mục chính</DialogTitle></DialogHeader>
          <div className="py-4"><Label htmlFor="category-name">Tên danh mục</Label><Input id="category-name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Hủy</Button><Button onClick={handleAddCategory}>Thêm</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm dịch vụ con</DialogTitle></DialogHeader>
          <div className="py-4"><Label htmlFor="service-name">Tên dịch vụ</Label><Input id="service-name" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Hủy</Button><Button onClick={handleAddService}>Thêm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublicServices;