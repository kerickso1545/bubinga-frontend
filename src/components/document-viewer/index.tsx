import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getDocumentPage, getDocumentPages } from '../../lib/api';
import { encodeDocId } from '../../lib/utils';

interface DocumentViewerProps {
  filePath: string;
  onPageChange?: (page: number) => void;
  boundingBoxes?: Record<number, Array<{ id: string; box: BoundingBox }>>;
  currentPage?: number;
}

export function DocumentViewer({
  filePath,
  onPageChange,
  boundingBoxes,
  currentPage: externalCurrentPage,
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(externalCurrentPage || 1);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (externalCurrentPage && externalCurrentPage !== currentPage) {
      setCurrentPage(externalCurrentPage);
    }
  }, [externalCurrentPage]);

  // Fetch total pages from the API
  useEffect(() => {
    async function fetchTotalPages() {
      try {
        const match = filePath.match(/processes[/\\].+/);
        if (match) {
          const relativePath = match[0].replace(/\\/g, '/');
          const docId = encodeDocId(relativePath);
          const pages = await getDocumentPages(docId);
          setTotalPages(pages);
        }
      } catch (error) {
        console.error('Failed to fetch total pages:', error);
      }
    }

    fetchTotalPages();
  }, [filePath]);

  const loadPage = useCallback(async (pageNumber: number) => {
    try {
      setLoading(true);
      const blob = await getDocumentPage(filePath, pageNumber);
      const url = URL.createObjectURL(blob);
      setPageUrl(url);
      onPageChange?.(pageNumber);
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  }, [filePath, onPageChange]);

  useEffect(() => {
    loadPage(currentPage);
    return () => {
      if (pageUrl) {
        URL.revokeObjectURL(pageUrl);
      }
    };
  }, [currentPage, loadPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => {
      const newZoom = prev + delta;
      return Math.min(Math.max(newZoom, 50), 200); // Limit zoom between 50% and 200%
    });
  };

  const currentBoxes = boundingBoxes?.[currentPage] || [];

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
              className="w-16 text-center"
            />
            <span className="text-sm text-gray-500">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-10)}
            disabled={zoomLevel <= 50}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 w-16 text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(10)}
            disabled={zoomLevel >= 200}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document viewer */}
      <div className="flex-grow overflow-auto bg-gray-100">
        <div className="min-w-full min-h-full flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          ) : pageUrl && (
            <div 
              className="relative"
              style={{
                minWidth: zoomLevel > 100 ? `${zoomLevel}%` : '100%',
                padding: '1rem'
              }}
            >
              <img
                src={pageUrl}
                alt={`Page ${currentPage}`}
                className="max-w-full h-auto"
                style={{
                  width: `${zoomLevel}%`,
                  transition: 'width 0.2s ease-in-out'
                }}
              />
              {currentBoxes.map(({ id, box }) => (
                <div
                  key={id}
                  className="absolute border-2 border-blue-500 bg-blue-500/10"
                  style={{
                    top: `${box.top}%`,
                    left: `${box.left}%`,
                    width: `${box.right - box.left}%`,
                    height: `${box.bottom - box.top}%`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}