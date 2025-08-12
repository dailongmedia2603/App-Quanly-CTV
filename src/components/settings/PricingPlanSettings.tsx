import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { Plus, Trash2, Pencil } from 'lucide-react';

interface Plan {
  id?: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  button_text: string;
  is_featured: boolean;
  sort_order: number;
}

const PricingPlanSettings = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('pricing_plans').select('*').order('sort_order');
    if (error) {
      showError('Không thể tải danh sách gói giá.');
    } else {
      setPlans(data as Plan[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEdit = (plan: Plan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan))); // Deep copy
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlan({
      name: '', price: '', period: '/ tháng', description: '',
      features: [''], button_text: 'Nâng cấp', is_featured: false,
      sort_order: plans.length + 1
    });
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setIsSaving(true);
    const toastId = showLoading('Đang lưu gói giá...');
    const { error } = await supabase.from('pricing_plans').upsert(editingPlan);
    dismissToast(toastId);
    if (error) {
      showError(`Lưu thất bại: ${error.message}`);
    } else {
      showSuccess('Lưu gói giá thành công!');
      setIsDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    }
    setIsSaving(false);
  };

  const handleDelete = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete || !planToDelete.id) return;
    setIsSaving(true);
    const toastId = showLoading('Đang xóa...');
    const { error } = await supabase.from('pricing_plans').delete().eq('id', planToDelete.id);
    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess('Xóa gói giá thành công!');
      fetchPlans();
    }
    setIsDeleteAlertOpen(false);
    setPlanToDelete(null);
    setIsSaving(false);
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  const addFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] });
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    const newFeatures = editingPlan.features.filter((_, i) => i !== index);
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  return (
    <Card className="border-orange-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bảng giá dịch vụ</CardTitle>
          <CardDescription>Quản lý các gói giá hiển thị trên trang Pricing.</CardDescription>
        </div>
        <Button onClick={handleAddNew} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />Thêm gói mới</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p>Đang tải...</p> : (
          <div className="space-y-2">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="font-medium">{plan.name} {plan.is_featured && <span className="text-xs text-brand-orange">(Phổ biến)</span>}</div>
                <div className="space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(plan)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? 'Sửa gói giá' : 'Tạo gói giá mới'}</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Tên gói</Label><Input value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Mô tả</Label><Input value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Giá</Label><Input value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: e.target.value})} /></div>
              <div className="space-y-2"><Label>Chu kỳ</Label><Input value={editingPlan.period} onChange={e => setEditingPlan({...editingPlan, period: e.target.value})} /></div>
              <div className="space-y-2"><Label>Nút bấm</Label><Input value={editingPlan.button_text} onChange={e => setEditingPlan({...editingPlan, button_text: e.target.value})} /></div>
              <div className="flex items-center space-x-2"><Switch id="is_featured" checked={editingPlan.is_featured} onCheckedChange={c => setEditingPlan({...editingPlan, is_featured: c})} /><Label htmlFor="is_featured">Là gói phổ biến?</Label></div>
              <div className="col-span-2 space-y-2">
                <Label>Tính năng</Label>
                {editingPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={feature} onChange={e => handleFeatureChange(index, e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeFeature(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFeature}>Thêm tính năng</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSavePlan} disabled={isSaving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSaving ? 'Đang lưu...' : 'Lưu'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa gói "{planToDelete?.name}" không? Hành động này không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSaving} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PricingPlanSettings;