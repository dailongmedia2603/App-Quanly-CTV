import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Search,
  ChevronRight,
  Plus,
  ListFilter,
  Pencil,
  Trash2,
  Upload,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface WebsiteSource {
  id: string;
  url: string;
  endpoint: string | null;
  pages: number | null;
  created_at: string;
  origin: string | null;
}

const DataSourceWebsite = () => {
  const [websites, setWebsites] = useState<WebsiteSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("scrape");

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<WebsiteSource | null>(null);
  const [updatedUrl, setUpdatedUrl] = useState("");
  const [updatedEndpoint, setUpdatedEndpoint] = useState("");

  // Delete state
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<WebsiteSource | null>(null);

  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const fetchWebsites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("list_nguon_website")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching websites:", error);
      showError("Không thể tải danh sách website.");
    } else {
      setWebsites(data as WebsiteSource[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleAddWebsite = async () => {
    if (!newUrl) {
      showError("Vui lòng nhập URL.");
      return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Đang thêm website...");

    const { error } = await supabase
      .from("list_nguon_website")
      .insert([{ url: newUrl, endpoint: `/${newEndpoint}`, origin: "Manual" }]);

    dismissToast(toastId);
    if (error) {
      showError(`Thêm thất bại: ${error.message}`);
    } else {
      showSuccess("Thêm website thành công!");
      setIsAddDialogOpen(false);
      setNewUrl("");
      setNewEndpoint("scrape");
      fetchWebsites();
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (website: WebsiteSource) => {
    setEditingWebsite(website);
    setUpdatedUrl(website.url);
    setUpdatedEndpoint(website.endpoint?.replace('/', '') || 'scrape');
    setIsEditDialogOpen(true);
  };

  const handleUpdateWebsite = async () => {
    if (!editingWebsite || !updatedUrl) {
      showError("URL không được để trống.");
      return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Đang cập nhật...");

    const { error } = await supabase
      .from("list_nguon_website")
      .update({ url: updatedUrl, endpoint: `/${updatedEndpoint}` })
      .eq("id", editingWebsite.id);

    dismissToast(toastId);
    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật thành công!");
      setIsEditDialogOpen(false);
      fetchWebsites();
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (website: WebsiteSource) => {
    setWebsiteToDelete(website);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteWebsite = async () => {
    if (!websiteToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");

    const { error } = await supabase
      .from("list_nguon_website")
      .delete()
      .eq("id", websiteToDelete.id);

    dismissToast(toastId);
    if (error) {
      showError(`Xóa thất bại: ${error.message}`);
    } else {
      showSuccess("Xóa thành công!");
      fetchWebsites();
    }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handleDownloadTemplate = () => {
    const sampleData = [{ url: 'https://example.com/page1', endpoint: '/scrape' }];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Add data validation for the endpoint column (B)
    const validation = {
      type: 'list',
      formula1: '"/scrape,/crawl,/map"',
      showDropDown: true,
      allowBlank: false,
      error: 'Vui lòng chọn một endpoint hợp lệ từ danh sách: /scrape, /crawl, /map.',
      errorTitle: 'Endpoint không hợp lệ',
    };

    // Apply validation to a range of cells, e.g., B2 to B101
    if (!worksheet['!dataValidation']) {
      worksheet['!dataValidation'] = [];
    }
    worksheet['!dataValidation'].push({
      sqref: 'B2:B101', // Apply to 100 rows
      opts: validation,
    });

    XLSX.writeFile(workbook, "mau_import_website.xlsx");
  };

  const handleImport = () => {
    if (!importFile) {
      showError("Vui lòng chọn một file để import.");
      return;
    }
    setIsSubmitting(true);
    const toastId = showLoading("Đang xử lý file...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as { url: string; endpoint: string }[];

        if (json.length === 0) {
          dismissToast(toastId);
          showError("File không có dữ liệu.");
          setIsSubmitting(false);
          return;
        }

        const newWebsites = json.map(row => {
          if (!row.url || !row.endpoint) {
            throw new Error("File phải có 2 cột 'url' và 'endpoint'.");
          }
          const validEndpoints = ['/scrape', '/crawl', '/map'];
          if (!validEndpoints.includes(row.endpoint)) {
              throw new Error(`Endpoint không hợp lệ: ${row.endpoint}. Chỉ chấp nhận /scrape, /crawl, /map.`);
          }
          return {
            url: String(row.url),
            endpoint: String(row.endpoint),
            origin: 'Import'
          };
        });

        dismissToast(toastId);
        const insertToastId = showLoading(`Đang import ${newWebsites.length} website...`);

        const { error } = await supabase.from('list_nguon_website').insert(newWebsites);

        dismissToast(insertToastId);
        if (error) {
          showError(`Import thất bại: ${error.message}`);
        } else {
          showSuccess(`Import thành công ${newWebsites.length} website!`);
          setIsImportDialogOpen(false);
          setImportFile(null);
          fetchWebsites();
        }
      } catch (error: any) {
        dismissToast(toastId);
        showError(`Lỗi xử lý file: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsArrayBuffer(importFile);
  };

  const filteredWebsites = websites.filter((website) => {
    const matchesSearch = website.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEndpoint = endpointFilter === "all" || website.endpoint === `/${endpointFilter}`;
    return matchesSearch && matchesEndpoint;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nguồn Website</h1>
        <p className="text-gray-500 mt-1">
          Quản lý danh sách các url website muốn theo dõi để lấy dữ liệu.
        </p>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm bằng URL"
              className="pl-10 border-orange-200 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 border-orange-200">
                <ListFilter className="h-4 w-4" />
                <span>
                  {endpointFilter === 'all' ? 'Tất cả Endpoints' : `/${endpointFilter}`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={endpointFilter} onValueChange={setEndpointFilter}>
                <DropdownMenuRadioItem value="all">Tất cả</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="scrape">/scrape</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="crawl">/crawl</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="map">/map</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 border-orange-200">
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
              <DialogHeader>
                <DialogTitle>Import Website từ file Excel</DialogTitle>
                <DialogDescription>
                  Chọn file .xlsx hoặc .csv để import hàng loạt. File phải có 2 cột: 'url' và 'endpoint'.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Chọn file</Label>
                  <Label htmlFor="import-file" className="w-full cursor-pointer">
                    <div className="flex items-center justify-between w-full h-10 px-3 text-sm border rounded-md border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {importFile ? importFile.name : "No file chosen"}
                      </span>
                      <div className="px-3 py-1 ml-4 text-sm font-semibold rounded-md shrink-0 bg-brand-orange-light text-brand-orange hover:bg-orange-200">
                        Choose File
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="import-file"
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                <Button variant="link" onClick={handleDownloadTemplate} className="text-brand-orange justify-start p-0 h-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Tải file mẫu
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Hủy</Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isSubmitting || !importFile}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                >
                  {isSubmitting ? "Đang import..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Thêm Website</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white via-brand-orange-light/50 to-white">
              <DialogHeader>
                <DialogTitle>Thêm nguồn Website mới</DialogTitle>
                <DialogDescription>
                  Nhập URL và chọn Endpoint cho website bạn muốn theo dõi.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Select value={newEndpoint} onValueChange={setNewEndpoint}>
                    <SelectTrigger id="endpoint">
                      <SelectValue placeholder="Chọn một endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scrape">/scrape</SelectItem>
                      <SelectItem value="crawl">/crawl</SelectItem>
                      <SelectItem value="map">/map</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                <Button 
                  onClick={handleAddWebsite} 
                  disabled={isSubmitting}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white"
                >
                  {isSubmitting ? "Đang thêm..." : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-orange-200 rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Số trang</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead className="text-right w-[120px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredWebsites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Không tìm thấy website nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredWebsites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="text-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-sm">
                    {website.url}
                  </TableCell>
                  <TableCell>{website.endpoint || "N/A"}</TableCell>
                  <TableCell>{website.pages}</TableCell>
                  <TableCell>
                    {format(new Date(website.created_at), 'dd/MM/yy HH:mm')}
                  </TableCell>
                  <TableCell>{website.origin}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(website)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(website)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sửa nguồn Website</DialogTitle>
            <DialogDescription>
              Cập nhật URL và Endpoint cho website.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={updatedUrl}
                onChange={(e) => setUpdatedUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-endpoint">Endpoint</Label>
              <Select value={updatedEndpoint} onValueChange={setUpdatedEndpoint}>
                <SelectTrigger id="edit-endpoint">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scrape">/scrape</SelectItem>
                  <SelectItem value="crawl">/crawl</SelectItem>
                  <SelectItem value="map">/map</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateWebsite} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn website khỏi danh sách của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWebsite} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-end space-x-4 text-sm font-medium">
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200" disabled>
          Trước
        </Button>
        <span className="text-gray-800">Trang 1</span>
        <Button variant="outline" size="sm" className="text-gray-600 border-orange-200">
          Sau
        </Button>
      </div>
    </div>
  );
};

export default DataSourceWebsite;