import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoPlayerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  videoUrl: string | null;
}

export const VideoPlayerDialog = ({ isOpen, onOpenChange, videoUrl }: VideoPlayerDialogProps) => {
  if (!videoUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 border-0 bg-black">
        <div className="aspect-video">
          <iframe
            src={videoUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
};