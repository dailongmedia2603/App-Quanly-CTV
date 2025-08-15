import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacebookReportDetailsDialog } from "@/components/FacebookReportDetailsDialog";
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';
import { ExternalLink, FileText, Users, MessageSquare, Clock, Tags, Link as LinkIcon, Sparkles, Copy, RefreshCw, Loader2 } from 'lucide-react';

interface ReportData {
  id: string;
  campaign_id: string;
  identified_service_id?: string | null;
  identified_service_name?: string | null;
  ai_evaluation?: string | null;
  description: string | null;
  source_url: string | null;
  posted_at: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  suggested_comment?: string | null;
  // Properties required by FacebookReportDetailsDialog
  title: string | null;
  price: string | null;
  area: string | null;
  address: string | null;
  listing_url: string | null;
  posted_date_string: string | null;
}

const FindCustomers = () => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<ReportData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [generatingCommentIds, setGeneratingCommentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchReportData = async () => {
      setLoadingReports(true);
      const { data, error } = await supabase.functions.invoke(
        'get-facebook-posts-for-customer-finder'
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
  }, []);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reportData.slice(startIndex, startIndex + itemsPerPage);
  }, [reportData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  const handleViewDetails = (item: ReportData) => {
    setSelectedItemDetails(item);
    setIsDetailsModalOpen(true);
  };

  const handleCopyComment = (comment: string | null | undefined) => {
    if (!comment) return;
    navigator.clipboard.writeText(comment).then(() => {
      showSuccess("Đã sao chép comment!");
    }).catch(err => {
      showError("Không thể sao chép.");
      console.error('Could not copy text: ', err);
    });
  };

  const handleGenerateComment = async (item: ReportData) => {
    if (!item.description) {
      showError("Bài viết không có nội dung để tạo comment.");
      return;
    }
    setGeneratingCommentIds(prev => new Set(prev).add(item.id));
    try {
      const { data, error } = await supabase.functions.invoke('generate-customer-finder-comment', {
        body: {
          reportId: item.id,
          postContent: item.description,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const { comment, service } = data;

      setReportData(prevData =>
        prevData.map(report =>
          report.id === item.id
            ? { 
                ...report, 
                suggested_comment: comment,
                identified_service_id: service.id,
                identified_service_name: service.name,
              }
            : report
        )
      );
      showSuccess("Đã tạo comment thành công!");

    } catch (error: any) {
      showError(`Lỗi tạo comment: ${error.message}`);
    } finally {
      setGeneratingCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  return (
    <>
      <div>
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-brand-orange" />
              <span>Khách hàng tiềm năng ({reportData.length})</span>
            </CardTitle>
            <CardDescription>Danh sách các khách hàng tiềm năng được thu thập. Bấm vào nút để AI tạo comment giới thiệu dịch vụ phù hợp.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><div className="flex items-center space-x-2"><FileText className="h-4 w-4" /><span>Nội dung bài viết</span></div></TableHead>
                    <TableHead><div className="flex items-center space-x-2"><MessageSquare className="h-4 w-4" /><span>Comment đề xuất</span></div></TableHead>
                    <TableHead><div className="flex items-center space-x-2"><Clock className="h-4 w-4" /><span>Thời gian đăng</span></div></TableHead>
                    <TableHead><div className="flex items-center space-x-2"><Tags className="h-4 w-4" /><span>Dịch vụ phù hợp</span></div></TableHead>
                    <TableHead className="text-right"><div className="flex items-center justify-end space-x-2"><LinkIcon className="h-4 w-4" /><span>Link</span></div></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReports ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Đang tải kết quả...</TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <FileText className="h-10 w-10 mb-2" />
                          Không tìm thấy kết quả nào.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-md truncate cursor-pointer hover:text-brand-orange" onClick={() => handleViewDetails(item)}>
                          {item.description}
                        </TableCell>
                        <TableCell className="max-w-sm">
                          {generatingCommentIds.has(item.id) ? (
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Đang tạo comment...</span>
                            </div>
                          ) : item.suggested_comment ? (
                            <div className="space-y-2">
                              <p className="whitespace-pre-wrap text-sm">{item.suggested_comment}</p>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleCopyComment(item.suggested_comment)}>
                                  <Copy className="h-3 w-3 mr-1" /> Sao chép
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleGenerateComment(item)}>
                                  <RefreshCw className="h-3 w-3 mr-1" /> Tạo lại
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => handleGenerateComment(item)}
                              className="bg-brand-orange text-white hover:bg-brand-orange/90 animate-pulse"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Tạo comment giới thiệu
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                        <TableCell>
                          {item.identified_service_name ? (
                            <Badge variant="default">{item.identified_service_name}</Badge>
                          ) : <span className="text-gray-400 italic">Chưa xác định</span>}
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