import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelectCombobox, SelectOption } from "@/components/ui/multi-select-combobox";
import { FacebookReportDetailsDialog } from "@/components/FacebookReportDetailsDialog";
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { ExternalLink, Search, FileText } from 'lucide-react';

interface ReportData {
  id: string;
  campaign_id: string;
  keywords_found?: string[] | null;
  ai_evaluation?: string | null;
  description: string | null;
  source_url: string | null;
  posted_at: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  // Properties required by FacebookReportDetailsDialog
  title: string | null;
  price: string | null;
  area: string | null;
  address: string | null;
  listing_url: string | null;
  posted_date_string: string | null;
}

const FindCustomers = () => {
  const [campaigns, setCampaigns] = useState<SelectOption[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<ReportData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      const { data, error } = await supabase
        .from('danh_sach_chien_dich')
        .select('id, name')
        .in('type', ['Facebook', 'Tổng hợp']);
      
      if (error) {
        showError("Không thể tải danh sách chiến dịch.");
      } else {
        setCampaigns(data.map(c => ({ value: c.id, label: c.name })));
      }
      setLoadingCampaigns(false);
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedCampaignIds.length === 0) {
        setReportData([]);
        return;
      }
      setLoadingReports(true);
      const { data, error } = await supabase.functions.invoke(
        'get-facebook-posts-for-customer-finder',
        { body: { campaign_ids: selectedCampaignIds } }
      );

      if (error) {
        showError(`Không thể tải dữ liệu: ${error.message}`);
        setReportData([]);
      } else {
        setReportData(data as ReportData[]);
      }
      setLoadingReports(false);
    };

    fetchReportData();
  }, [selectedCampaignIds]);

  const filteredData = useMemo(() => {
    return reportData.filter(item => 
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleViewDetails = (item: ReportData) => {
    setSelectedItemDetails(item);
    setIsDetailsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tìm khách hàng</h1>
          <p className="text-gray-500 mt-1">
            Xem và phân tích các bài viết thu thập được từ chiến dịch Facebook.
          </p>
        </div>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
            <CardDescription>Lọc kết quả theo chiến dịch và từ khóa tìm kiếm.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn chiến dịch</label>
              <MultiSelectCombobox
                options={campaigns}
                selected={selectedCampaignIds}
                onChange={setSelectedCampaignIds}
                placeholder="Chọn một hoặc nhiều chiến dịch"
                searchPlaceholder="Tìm chiến dịch..."
                emptyPlaceholder={loadingCampaigns ? "Đang tải..." : "Không có chiến dịch Facebook."}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm trong nội dung</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nhập từ khóa để tìm..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Kết quả ({filteredData.length})</CardTitle>
            <CardDescription>Danh sách các bài viết phù hợp với bộ lọc của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nội dung bài viết</TableHead>
                    <TableHead>Thời gian đăng</TableHead>
                    <TableHead>Từ khoá</TableHead>
                    <TableHead className="text-right">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReports ? (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Đang tải kết quả...</TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <FileText className="h-10 w-10 mb-2" />
                          {selectedCampaignIds.length === 0 ? "Vui lòng chọn một chiến dịch để xem kết quả." : "Không tìm thấy kết quả nào."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-md truncate cursor-pointer hover:text-brand-orange" onClick={() => handleViewDetails(item)}>
                          {item.description}
                        </TableCell>
                        <TableCell>{item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                        <TableCell>
                          {item.keywords_found && item.keywords_found.length > 0 ? (
                            <div className="flex flex-wrap gap-1">{item.keywords_found.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}</div>
                          ) : <span className="text-gray-400">Không có</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild className="text-brand-orange hover:bg-brand-orange-light hover:text-brand-orange">
                            <a href={item.source_url!} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Trước</Button>
                <span className="text-sm">Trang {currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Sau</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <FacebookReportDetailsDialog
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        item={selectedItemDetails}
      />
    </>
  );
};

export default FindCustomers;