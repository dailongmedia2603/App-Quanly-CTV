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
import { Plus, Pencil, Trash2, Video } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VideoGuide {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
}

const getYoutubeEmbedUrl = (url: string): string | null => {
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
    // Handle invalid URLs
    return null;
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return null;
};

const VideoGuidesTab = () => {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('Super Admin');
  const [guides, setGuides] = useState<VideoGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<VideoGuide | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState<VideoGuide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const fetchGuides = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('video_guides').select('*').order('created_at');
    if (error) showError("Không thể tải video hướng dẫn.");
    else setGuides(data as VideoGuide[]);
    setLoading(false);
  };

  useEffect(() => { fetchGuides(); }, []);

  const resetForm = () => { setTitle(''); setDescription(''); setYoutubeUrl(''); };

  const handleAddNewClick = () => { resetForm(); setEditingGuide(null); setIsDialogOpen(true); };
  const handleEditClick = (guide: VideoGuide) => { setEditingGuide(guide); setTitle(guide.title); setDescription(guide.description || ''); setYoutubeUrl(guide.youtube_url); setIsDialogOpen(true); };
  const handleDeleteClick = (guide: VideoGuide) => { setGuideToDelete(guide); setIsDeleteAlertOpen(true); };

  const handleSave = async () => {
    if (!title.trim() || !youtubeUrl.trim()) return showError("Vui lòng nhập tiêu đề và link YouTube.");
    setIsSubmitting(true);
    const toastId = showLoading(editingGuide ? "Đang cập nhật..." : "Đang thêm...");
    const payload = { title, description, youtube_url: youtubeUrl };
    const query = editingGuide ? supabase.from('video_guides').update(payload).eq('id', editingGuide.id) : supabase.from('video_guides').insert(payload);
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
    const { error } = await supabase.from('video_guides').delete().eq('id', guideToDelete.id);
    dismissToast(toastId);
    if (error) showError(`Xóa thất bại: ${error.message}`);
    else { showSuccess("Xóa thành công!"); fetchGuides(); }
    setIsDeleteAlertOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleAddNewClick} className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Plus className="mr-2 h-4 w-4" />Thêm Video</Button>
        </div>
      )}
      {loading ? <p>Đang tải...</p> : guides.length === 0 ? <p className="text-center text-gray-500 py-8">Chưa có video hướng dẫn nào.</p> : (
        <Accordion type="single" collapsible className="w-full space-y-3">
          {guides.map(guide => {
            const embedUrl = getYoutubeEmbedUrl(guide.youtube_url);
            return (
              <AccordionItem value={guide.id} key={guide.id} className="border border-orange-200 rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="p-4 hover:no-underline hover:bg-orange-50/50 rounded-t-lg data-[state=open]:border-b data-[state=open]:border-orange-200">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-left text-gray-800">{guide.title}</span>
                    {isSuperAdmin && (
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditClick(guide); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteClick(guide); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-white rounded-b-lg">
                  <div className="space-y-4">
                    {guide.description && <div className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.description}</ReactMarkdown></div>}
                    {embedUrl ? (
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe src={embedUrl} title={guide.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe>
                      </div>
                    ) : <p className="text-red-500">Link YouTube không hợp lệ.</p>}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingGuide ? 'Sửa Video' : 'Thêm Video mới'}</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="space-y-2"><Label htmlFor="title">Tiêu đề</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="youtube-url">Link YouTube</Label><Input id="youtube-url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="description">Mô tả</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xác nhận xóa</AlertDialogTitle><AlertDialogDescription>Bạn có chắc muốn xóa video "{guideToDelete?.title}" không?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

export default VideoGuidesTab;