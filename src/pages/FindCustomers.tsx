import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacebookReportDetailsDialog } from "@/components/FacebookReportDetailsDialog";
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';
import { ExternalLink, FileText, Users, MessageSquare, Clock, Tags, Link as LinkIcon, Sparkles, Copy, RefreshCw, Loader2, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerFinderGroupsTab from '@/components/customer-finder/CustomerFinderGroupsTab';
import { useIsMobile } from '@/hooks/use-mobile';
import { Label } from '@/components/ui/label';

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

const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/#+\s/g, '') // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
    .replace(/~~(.*?)~~/g, '$1'); // Strikethrough
};

const FindCustomers = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<ReportData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [generatingCommentIds, setGeneratingCommentIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const fetchReportData = async () => {
    if (!user) {
      setReportData([]);
      setLoadingReports(false);
      return;
    }
    setLoadingReports(true);
    const { data: reports, error: reportsError } = await supabase.functions.invoke(
      'get-facebook-posts-for-customer-finder'
    );

    if (reportsError) {
      showError(`Không thể tải dữ liệu: ${reportsError.message}`);
      setReportData([]);
      setLoadingReports(false);
      return;
    }

    if (reports && reports.length > 0) {
      const reportIds = reports.map((r: ReportData) => r.id);
      const { data: comments, error: commentsError } = await supabase
        .from('user_suggested_comments')
        .select('report_id, comment_text')
        .eq('user_id', user.id)
        .in('report_id', reportIds);

      if (commentsError) {
        showError("Không thể tải các comment đã tạo.");
      }

      const commentsMap = new Map(comments?.map(c => [c.report_id, c.comment_text]));
      const mergedData = reports.map((report: ReportData) => ({
        ...report,
        suggested_comment: commentsMap.get(report.id) || null,
      }));
      setReportData(mergedData);
    } else {
      setReportData([]);
    }

    setLoadingReports(false);
  };

  useEffect(() => {
    fetchReportData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('user-suggested-comments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_suggested_comments',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const updatedRecord = payload.new as { report_id: string; comment_text: string };
        const deletedRecord = payload.old as { report_id: string };

        setReportData(prevData =>
          prevData.map(report => {
            if (payload.eventType === 'INSERT' && report.id === updatedRecord.report_id) {
              setGeneratingCommentIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(report.id);
                return newSet;
              });
              return { ...report, suggested_comment: updatedRecord.comment_text };
            }
            if (payload.eventType === 'DELETE' && report.id === deletedRecord.report_id) {
              return { ...report, suggested_comment: null };
            }
            return report;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
    const plainText = stripMarkdown(comment);
    navigator.clipboard.writeText(plainText).then(() => {
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
      const { error } = await supabase.functions.invoke('trigger-generate-comment', {
        body: {
          reportId: item.id,
          postContent: item.description,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      // No need to show success here, the realtime listener will update the UI
    } catch (error: any) {
      showError(`Lỗi khi gửi yêu cầu: ${error.message}`);
      setGeneratingCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const renderCommentSection = (item: ReportData) => {
    if (generatingCommentIds.has(item.id)) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang tạo comment...</span>
        </div>
      );
    }
    if (item.suggested_comment) {
      return (
        <div className="space-y-2">
          <p className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-md border">{item.suggested_comment}</p>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => handleCopyComment(item.suggested_comment)}>
              <Copy className="h-3 w-3 mr-1" /> Sao chép
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleGenerateComment(item)}>
              <RefreshCw className="h-3 w-3 mr-1" /> Tạo lại
            </Button>
          </div>
        </div>
      );
    }
    return (
      <Button 
        onClick={() => handleGenerateComment(item)}
        className="bg-brand-orange text-white hover:bg-brand-orange/90 animate-pulse w-full sm:w-auto"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Tạo comment giới thiệu
      </Button>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tìm khách hàng</h1>
          <p className="text-gray-500 mt-1">Công cụ AI tự động quét và đề xuất các khách hàng tiềm năng từ mạng xã hội.</p>
        </div>
        <Tabs defaultValue="potential-customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md rounded-lg border border-orange-200 p-0 bg-white">
            <TabsTrigger value="potential-customers" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-l-md">
              <Users className="h-4 w-4" />
              <span>Khách hàng tiềm năng</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-1 flex items-center justify-center space-x-2 py-2 font-medium text-brand-orange data-[state=active]:bg-brand-orange-light data-[state=active]:font-bold rounded-r-md">
              <ListChecks className="h-4 w-4" />
              <span>Group tìm khách hàng</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="potential-customers" className="pt-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-brand-orange" />
                  <span>Khách hàng tiềm năng ({reportData.length})</span>
                </CardTitle>
                <CardDescription>Danh sách các khách hàng tiềm năng được thu thập. Bấm vào nút để AI tạo comment giới thiệu dịch vụ phù hợp.</CardDescription>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-4">
                    {loadingReports ? (
                      <p className="text-center text-gray-500 py-8">Đang tải...</p>
                    ) : paginatedData.length === 0 ? (
                      <div className="text-center text-gray-500 py-10">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 font-medium">Không tìm thấy kết quả nào.</p>
                      </div>
                    ) : (
                      paginatedData.map((item) => (
                        <Card key={item.id} className="overflow-hidden border-orange-100">
                          <CardContent className="p-4 space-y-4">
                            <p className="text-sm font-medium leading-relaxed cursor-pointer hover:text-brand-orange" onClick={() => handleViewDetails(item)}>
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-orange-100 pt-3">
                              <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>{item.posted_at ? format(new Date(item.posted_at), 'dd/MM/yy HH:mm') : 'N/A'}</span>
                              </div>
                              <Button variant="link" asChild className="p-0 h-auto text-brand-orange">
                                <a href={item.source_url!} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" /> Xem gốc
                                </a>
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-600">Dịch vụ phù hợp</Label>
                              <div>
                                {item.identified_service_name ? (
                                  <Badge variant="default">{item.identified_service_name}</Badge>
                                ) : <span className="text-xs text-gray-400 italic">Chưa xác định</span>}
                              </div>
                            </div>
                            <div className="space-y-2 pt-2">
                              <Label className="text-xs font-semibold text-gray-600">Comment đề xuất</Label>
                              {renderCommentSection(item)}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                ) : (
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
                                {renderCommentSection(item)}
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
                )}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Trước</Button>
                    <span className="text-sm">Trang {currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Sau</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="groups" className="pt-6">
            <CustomerFinderGroupsTab />
          </TabsContent>
        </Tabs>
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