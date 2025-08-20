import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Plus, Pencil, Trash2, Video, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VideoPlayerDialog } from './VideoPlayerDialog';

interface Guide {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
}

const getYoutubeEmbedUrl = (url: string, autoplay = false): string | null => {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    }
  } catch (e) {
    return null;
  }
  if (videoId) {
    let embedUrl = `https://www.youtube.com/embed/${videoId}`;
    if (autoplay) {
      embedUrl += '?autoplay=1';
    }
    return embedUrl;
  }
  return null;
};

const CustomerFindingGuidesTab = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const fetchGuides = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customer_finding_guides').select('*').order('created_at');
    if (error) showError("Không thể tải video hướng dẫn.");
    else setGuides(data as Guide[]);
    setLoading(false);
  };

  useEffect(() => { fetchGuides(); }, []);

  const resetForm = () => { setTitle(''); setDescription(''); setYoutubeUrl(''); setThumbnailFile(null); };
  const handleAddNewClick = () => { resetForm(); setEditingGuide(null); setIsDialogOpen(true); };
  const handleEditClick = (guide: Guide) => { setEditingGuide(guide); setTitle(guide.title); setDescription(guide.description || ''); setYoutubeUrl(guide.youtube_url); setThumbnailFile(null); setIsDialogOpen(true); };
  const handleDeleteClick = (guide: Guide) => { setGuideToDelete(guide); setIsDeleteAlertOpen(true); };

  const handleSave = async () => {
    if (!title.trim() || !youtubeUrl.trim()) return showError("Vui lòng nhập tiêu đề và link YouTube.");
    setIsSubmitting(true);
    const toastId = showLoading(editingGuide ? "Đang cập nhật..." : "Đang thêm...");

    let thumbnailUrl = editingGuide?.thumbnail_url || null;

    if (thumbnailFile) {
      const filePath = `public/customer_finding/${Date.now()}-${thumbnailFile.name}`;
      const { error: uploadError } = await supabase.storage.from('guide_thumbnails').upload(filePath, thumbnailFile);
      if (uploadError) {
        dismissToast(toastId);
        showError(`Tải thumbnail thất bại: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('guide_thumbnails').getPublicUrl(filePath);
      thumbnailUrl = publicUrl;
    }

    const payload = { title, description, youtube_url: youtubeUrl, thumbnail_url: thumbnailUrl };
    const query = editingGuide ? supabase.from('customer_finding_guides').update(payload).eq('id', editingGuide.id) : supabase.from('customer_finding_guides').insert(payload);
    const { error } = await query;
    dismissToast(toastId);
    if (error) showError(`Lưu thất bại: ${error.message}`);
    else { showSuccess("Lưu thành công!"); setIsDialogOpen(false); fetchGuides(); }
    setIsSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!guideToDelete) return;
    setIsSubmitting(true);
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('customer_finding_guides').delete().eq('id', guideToDelete.id);
    dismissToast(toastId);
    if (error) showError(`Xóa thất bại: ${error.message}`);
    else { showSuccess("Xóa thành công!"); fetchGuides(); }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  const handlePlayVideo = (url: string) => {
    const embedUrl = getYoutubeEmbedUrl(url, true);
    if (embedUrl) {
      setCurrentVideoUrl(embedUrl);
      setIsPlayerOpen(true);
    } else {
      showError("Link YouTube không hợp lệ.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        {isSuperAdmin && <div className="flex justify-end"><Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />Thêm Video</Button></div>}
        {loading ? <p>Đang tải...</p> : guides.length === 0 ? <p className="text-center text-gray-500 py-8">Chưa có video hướng dẫn nào.</p> : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {guides.map(guide => (
              <AccordionItem value={guide.id} key={guide.id} className="border border-orange-200 rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                  <div className="flex justify-between items-center w-full"><div className="flex items-center space-x-3"><Video className="h-5 w-5 text-brand-orange" /><span className="font-semibold text-left text-gray-800">{guide.title}</span></div>{isSuperAdmin && <div className="flex items-center space-x-1 flex-shrink-0 ml-4"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditClick(guide); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteClick(guide); }}><Trash2 className="h-4 w-4" /></Button></div>}</div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-white rounded-b-lg">
                  <div className="space-y-4">
                    {guide.description && <div className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.description}</ReactMarkdown></div>}
                    <div className="relative aspect-video cursor-pointer group rounded-lg overflow-hidden" onClick={() => handlePlayVideo(guide.youtube_url)}>
                      <img src={guide.thumbnail_url || `https://img.youtube.com/vi/${getYoutubeEmbedUrl(guide.youtube_url)?.split('/').pop()}/hqdefault.jpg`} alt={`Thumbnail for ${guide.title}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:opacity-100 opacity-80"><div className="relative h-16 w-16"><div className="absolute inset-0 rounded-full bg-brand-orange opacity-75 animate-pulse-orange"></div><PlayCircle className="relative h-16 w-16 text-white" /></div></div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingGuide ? 'Sửa Video' : 'Thêm Video mới'}</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label htmlFor="title">Tiêu đề</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="youtube-url">Link YouTube</Label><Input id="youtube-url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="description">Mô tả</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="thumbnail">Thumbnail (Đề xuất 1280x720px)</Label><Input id="thumbnail" type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files ? e.target.files[0] : null)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa video "{guideToDelete?.title}" không?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <VideoPlayerDialog isOpen={isPlayerOpen} onOpenChange={setIsPlayerOpen} videoUrl={currentVideoUrl} />
    </>
  );
};

export default CustomerFindingGuidesTab;