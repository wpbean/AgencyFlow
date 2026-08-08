"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive, VisuallyHidden } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type LightboxImage = {
  id: string;
  url: string;
  alt: string;
};

export function AttachmentLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const hasMultiple = images.length > 1;
  const current = images[index];

  const goPrev = () => onIndexChange((index - 1 + images.length) % images.length);
  const goNext = () => onIndexChange((index + 1) % images.length);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasMultiple) goPrev();
      if (e.key === "ArrowRight" && hasMultiple) goNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, hasMultiple]);

  if (!current) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <VisuallyHidden.Root asChild>
            <DialogPrimitive.Title>{current.alt}</DialogPrimitive.Title>
          </VisuallyHidden.Root>

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              className="absolute top-4 right-4 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </DialogPrimitive.Close>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div
            className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-12"
            onClick={onClose}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external attachment bytes served from our own API, not a Next-optimizable asset */}
            <img
              src={current.url}
              alt={current.alt}
              className="max-h-[85vh] max-w-[90vw] rounded-md object-contain shadow-2xl sm:max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {hasMultiple && (
            <div className="flex items-center justify-center gap-2 pb-4">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    i === index ? "bg-white" : "bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

export function useAttachmentLightbox() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return {
    openIndex,
    open: (index: number) => setOpenIndex(index),
    close: () => setOpenIndex(null),
    setIndex: setOpenIndex,
  };
}
