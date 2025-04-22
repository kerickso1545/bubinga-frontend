import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { DocumentViewer2 } from '../document-viewer2';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useLayoutStore } from '../../lib/store';
import { LeftMenu } from '../shared/LeftMenu';

interface BoundingBox {
  page: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface DocumentReviewLayoutProps {
  title: string;
  loading: boolean;
  error: string | null;
  pageUrl: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  boundingBoxes?: Array<{
    id: string;
    box: BoundingBox;
    confidence?: number;
    isActive?: boolean;
  }>;
  onBoundingBoxClick?: (id: string) => void;
  rightPanel: ReactNode;
  rightPanelWidth?: number;
  actionButtons?: ReactNode;
  onBackClick?: () => void;
}

export function DocumentReviewLayout({
  title,
  loading,
  error,
  pageUrl,
  currentPage,
  totalPages,
  onPageChange,
  boundingBoxes = [],
  onBoundingBoxClick,
  rightPanel,
  rightPanelWidth = 400,
  actionButtons,
  onBackClick
}: DocumentReviewLayoutProps) {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(rightPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  
  // Use the shared toolbar state
  const { isToolbarExpanded } = useLayoutStore();

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = Math.floor(window.innerWidth * 0.5);
      const constrainedWidth = Math.min(Math.max(newWidth, 300), maxWidth);
      setPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setViewerKey(prev => prev + 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    setViewerKey(prev => prev + 1);
  }, [isPanelOpen, isToolbarExpanded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !pageUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-accent-600">{error || 'Document not found'}</div>
      </div>
    );
  }

  return (
    <div id="mainContainer" className="fixed inset-0">
      <div id="topBar" className="fixed top-0 left-0 right-0 bg-[#eef5ff] shadow-sm z-50 h-12">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBackClick ? onBackClick() : navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {title}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {actionButtons}
          </div>
        </div>
      </div>

      <LeftMenu />

      <div 
        className={cn(
          "fixed top-12 bottom-0 transition-all duration-300",
          "bg-gray-100 z-10"
        )}
        style={{
          left: isToolbarExpanded ? '12rem' : '3rem',
          right: isPanelOpen ? `${panelWidth}px` : '0'
        }}
      >
        <DocumentViewer2
          key={viewerKey}
          imageUrl={pageUrl}
          boundingBoxes={boundingBoxes}
          onBoundingBoxClick={onBoundingBoxClick}
          className="h-full"
          isPanelOpen={isPanelOpen}
          isToolbarExpanded={isToolbarExpanded}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <div 
        style={{ 
          width: panelWidth,
          minWidth: `${panelWidth}px`,
          maxWidth: `${panelWidth}px`,
        }}
        className={cn(
          "fixed right-0 top-12 bottom-0 bg-white shadow-lg z-30 transition-transform",
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary-500 group"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute inset-y-0 -left-2 right-0 group-hover:bg-primary-500/10" />
        </div>

        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute -left-[18px] top-1/2 -translate-y-1/2 bg-white rounded-l shadow-md hover:bg-gray-50 w-[18px] h-16 flex items-center justify-center border border-r-0 cursor-pointer"
          title={isPanelOpen ? "Collapse panel" : "Expand panel"}
        >
          {isPanelOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {rightPanel}
      </div>
    </div>
  );
}