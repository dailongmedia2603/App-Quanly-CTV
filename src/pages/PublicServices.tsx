import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Link as LinkIcon, Info } from 'lucide-react';
import { showError } from '@/utils/toast';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price_list_url: string | null;
  category: string | null;
}

const PublicServices = () => {
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, Service[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_services')
        .select('*')
        .order('category')
        .order('name');

      if (error) {
        showError("Không thể tải danh sách dịch vụ.");
      } else {
        const grouped = (data as Service[]).reduce((acc, service) => {
          const category = service.category || 'Dịch vụ khác';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(service);
          return acc;
        }, {} as Record<string, Service[]>);
        setServicesByCategory(grouped);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dịch vụ & Báo giá</h1>
        <p className="text-gray-500 mt-1">
          Thông tin chi tiết và báo giá chính thức cho các dịch vụ của Dailong Media.
        </p>
      </div>
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>Danh sách dịch vụ</CardTitle>
          <CardDescription>
            Đây là tài liệu tham khảo dành cho tất cả cộng tác viên.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : Object.keys(servicesByCategory).length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 font-medium">Chưa có dịch vụ nào được thêm.</p>
              <p className="text-sm">Super Admin có thể thêm dịch vụ từ trang quản trị Supabase.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {Object.entries(servicesByCategory).map(([category, services]) => (
                <AccordionItem value={category} key={category} className="border border-orange-100 rounded-lg bg-white/50">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <span className="font-semibold text-lg text-gray-800">{category}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {services.map(service => (
                        <div key={service.id} className="p-4 bg-gray-50 rounded-md border">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-800">{service.name}</h4>
                            {service.price_list_url && (
                              <Button asChild variant="outline" size="sm">
                                <a href={service.price_list_url} target="_blank" rel="noopener noreferrer">
                                  <LinkIcon className="h-4 w-4 mr-2" />
                                  Xem báo giá
                                </a>
                              </Button>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicServices;