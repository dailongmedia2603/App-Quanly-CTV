import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

interface ImageLightboxProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  images: string[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export const ImageLightbox = ({
  isOpen,
  onOpenChange,
  images,
  selectedIndex,
  onSelectedIndexChange,
}: ImageLightboxProps) => {
  if (!images || images.length === 0) return null;

  const handleNext = () => {
    onSelectedIndexChange((selectedIndex + 1) % images.length);
  };

  const handlePrev = () => {
    onSelectedIndexChange((selectedIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen) {
        if (event.key === 'ArrowRight') {
          handleNext();
        } else if (event.key === 'ArrowLeft') {
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, images.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] bg-transparent border-none shadow-none p-0 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white z-50"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <img
            src={images[selectedIndex]}
            alt={`Image ${selectedIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};