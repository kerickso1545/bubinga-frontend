import { useState, useCallback, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  ArrowLeftRight,
  ArrowUpDown,
  Maximize,
  Minimize2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { useViewerStore } from '../../lib/store';

interface BoundingBox {
  page: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface DocumentViewerProps {
  imageUrl: string;
  boundingBoxes?: Array<{
    id: string;
    box: BoundingBox;
    confidence?: number;
    isActive?: boolean;
  }>;
  onBoundingBoxClick?: (id: string) => void;
  className?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isPanelOpen?: boolean;
  isToolbarExpanded?: boolean;
  renderToolbar?: boolean;
}

export function DocumentViewer2({
  imageUrl,
  boundingBoxes = [],
  onBoundingBoxClick,
  className,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isPanelOpen = true,
  isToolbarExpanded = false,
  renderToolbar = true
}: DocumentViewerProps) {
  const [showOverlays, setShowOverlays] = useState(true);
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { scale, positionX, positionY, setViewerState } = useViewerStore();

  // Filter bounding boxes for current page
  const currentPageBoundingBoxes = boundingBoxes.filter(
    ({ box }) => box.page === currentPage
  );

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
      setPageInput(newPage.toString());
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputBlur = () => {
    const newPage = parseInt(pageInput, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      handlePageChange(newPage);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  const fitToWidth = (ref: any) => {
    if (!ref || !imageRef.current || !contentRef.current) return;

    const padding = 48; // 24px on each side
    const contentWidth = contentRef.current.clientWidth - padding;
    const contentHeight = contentRef.current.clientHeight;
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    
    const scale = contentWidth / imageWidth;
    const scaledHeight = imageHeight * scale;
    
    // Add 24px top margin to the vertical position
    const y = Math.max(24, (contentHeight - scaledHeight) / 2);
    
    // Add padding/2 to x position to center horizontally
    ref.setTransform(padding/2, y, scale);
    
    // Save the state
    setViewerState({ scale, positionX: padding/2, positionY: y });
  };

  const fitToHeight = (ref: any) => {
    if (!ref || !imageRef.current || !contentRef.current) return;

    const padding = 48; // 24px on top and bottom
    const contentWidth = contentRef.current.clientWidth;
    const contentHeight = contentRef.current.clientHeight - padding;
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    
    const scale = contentHeight / imageHeight;
    const scaledWidth = imageWidth * scale;
    
    // Center horizontally
    const x = Math.max(24, (contentWidth - scaledWidth) / 2);
    
    // Add padding/2 to y position to center vertically
    ref.setTransform(x, padding/2, scale);
    
    // Save the state
    setViewerState({ scale, positionX: x, positionY: padding/2 });
  };

  return (
    <div 
      ref={viewerRef}
      className={cn(
        'relative bg-gray-100 overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-[100]' : 'h-full',
        className
      )}
    >
      <div ref={contentRef} className="absolute inset-0">
        <TransformWrapper
          initialScale={scale}
          initialPositionX={positionX}
          initialPositionY={positionY}
          minScale={0.1}
          maxScale={8}
          centerOnInit={false}
          limitToBounds={false}
          wheel={{ wheelDisabled: false }}
          doubleClick={{ disabled: false }}
          pinch={{ disabled: false }}
          onTransformed={(ref) => {
            setViewerState({
              scale: ref.state.scale,
              positionX: ref.state.positionX,
              positionY: ref.state.positionY
            });
          }}
        >
          {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
            <>
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full"
              >
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Document"
                    className="max-w-none"
                    draggable={false}
                    onLoad={() => {
                      // Default to fit to height on load
                      if (scale === 1 && positionX === 0 && positionY === 0) {
                        fitToHeight({ setTransform });
                      }
                    }}
                  />
                  
                  {showOverlays && currentPageBoundingBoxes.map(({ id, box, confidence, isActive }) => (
                    <div
                      key={id}
                      onClick={() => onBoundingBoxClick?.(id)}
                      className={cn(
                        'absolute border-2 transition-colors cursor-pointer',
                        confidence >= 0.9 ? 'border-green-500 bg-green-500/10' :
                        confidence >= 0.8 ? 'border-yellow-500 bg-yellow-500/10' :
                        'border-red-500 bg-red-500/10',
                        isActive && 'ring-2 ring-blue-500 ring-offset-2'
                      )}
                      style={{
                        top: `${box.top}%`,
                        left: `${box.left}%`,
                        width: `${box.right - box.left}%`,
                        height: `${box.bottom - box.top}%`,
                      }}
                    />
                  ))}
                </div>
              </TransformComponent>

              {renderToolbar && (
                <div 
                  id="viewerBottomToolbar"
                  className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]
                           bg-black/70 backdrop-blur-[6px] rounded-xl px-4 py-2
                           flex items-center gap-3 text-white shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="text-white hover:text-white/80"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={pageInput}
                        onChange={handlePageInputChange}
                        onBlur={handlePageInputBlur}
                        onKeyDown={handlePageInputKeyDown}
                        className="w-12 h-6 text-center bg-white/10 border-white/20 text-white"
                      />
                      <span className="text-sm">of {totalPages}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="text-white hover:text-white/80"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="w-px h-4 bg-white/20" />

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => zoomOut()}
                      className="text-white hover:text-white/80"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetTransform()}
                      className="text-white hover:text-white/80"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => zoomIn()}
                      className="text-white hover:text-white/80"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fitToWidth({ setTransform })}
                      className="text-white hover:text-white/80"
                      title="Fit to width"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fitToHeight({ setTransform })}
                      className="text-white hover:text-white/80"
                      title="Fit to height"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-white/80"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}