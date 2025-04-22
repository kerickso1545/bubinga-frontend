import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ZoomIn, ZoomOut, Save, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useExcerptStore } from '../../lib/store';

interface ImageExcerptProps {
  imageUrl: string | null;
  boundingBox: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null;
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  message?: string;
}

function ImageExcerpt({ 
  imageUrl, 
  boundingBox,
  className,
  style,
  position = 'top',
  message,
}: ImageExcerptProps) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { zoom, setZoom } = useExcerptStore();

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setImageSize(null);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    
    img.src = imageUrl;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  return (
    <div 
      className={cn(
        "fixed z-[100001] bg-white rounded-lg shadow-lg w-[300px] h-[150px]",
        "animate-in fade-in zoom-in-95 duration-200",
        "border border-gray-200/50",
        position === 'top' && "origin-bottom",
        position === 'bottom' && "origin-top",
        className
      )}
      style={{
        ...style,
        pointerEvents: 'auto',
      }}
    >
      <div className="absolute inset-0 border-2 border-dashed border-blue-300 m-4 rounded opacity-50"></div>
      
      {(!imageUrl || !boundingBox || !imageSize || !imageLoaded || imageError) ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm p-2">
          <div>
            {message || (imageError ? 'Error loading preview' : imageUrl && !imageLoaded ? 'Loading preview...' : 'No preview available')}
          </div>
          {imageUrl && (
            <div className="text-xs mt-2 text-gray-400 overflow-auto max-h-[80px] w-full text-center break-all">
              {imageUrl}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="relative w-full h-full overflow-hidden">
            {imageSize && boundingBox && (
              <>
                {(() => {
                  try {
                    const centerX = ((boundingBox.left + boundingBox.right) / 2 / 100) * imageSize.width;
                    const centerY = ((boundingBox.top + boundingBox.bottom) / 2 / 100) * imageSize.height;
                    
                    const width = ((boundingBox.right - boundingBox.left) / 100) * imageSize.width;
                    const height = ((boundingBox.bottom - boundingBox.top) / 100) * imageSize.height;
                    
                    const scaledWidth = Math.max(10, width * zoom);
                    const scaledHeight = Math.max(10, height * zoom);
                    const left = 150 - (centerX * zoom);
                    const top = 75 - (centerY * zoom);
                    
                    return (
                      <>
                        <img
                          src={imageUrl}
                          alt="Document excerpt"
                          className="absolute max-w-none transition-transform duration-200"
                          style={{
                            position: 'absolute',
                            left: `${left}px`,
                            top: `${top}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center',
                          }}
                        />
                        <div 
                          className="absolute z-10 border-2 border-blue-500 transition-all duration-200"
                          style={{
                            left: `${150 - (scaledWidth / 2)}px`,
                            top: `${75 - (scaledHeight / 2)}px`,
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`
                          }}
                        />
                      </>
                    );
                  } catch (e) {
                    console.error('Error calculating excerpt position:', e);
                    return (
                      <div className="flex items-center justify-center h-full text-red-500">
                        Error calculating position
                      </div>
                    );
                  }
                })()}
              </>
            )}
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ExcerptPortal({ 
  isVisible, 
  imageUrl, 
  boundingBox, 
  position
}: {
  isVisible: boolean;
  imageUrl: string | null;
  boundingBox: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null;
  position: {
    top: number;
    left: number;
    position: 'top' | 'bottom';
  } | null;
}) {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.zIndex = '100000';
    el.style.pointerEvents = 'none';
    
    document.body.appendChild(el);
    setPortalElement(el);
    
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  
  if (!portalElement || !isVisible || !position) {
    return null;
  }
  
  return createPortal(
    <ImageExcerpt
      imageUrl={imageUrl}
      boundingBox={boundingBox}
      style={{
        top: position.top,
        left: position.left,
        pointerEvents: 'auto',
      }}
      position={position.position}
      message={!boundingBox ? "No bounding box available" : undefined}
    />,
    portalElement
  );
}

interface ExtractionPanelProps {
  panelWidth: number;
  filteredFields: Array<{
    field: any;
    index: number;
  }>;
  selectedField: string | null;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  rowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>;
  handleFieldUpdate: (index: number, value: string | boolean) => void;
  imageUrl: string | null;
  currentFieldBox: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null;
  onFieldSelect: (index: number) => void;
  onSave: () => void;
  submitting: boolean;
}

export function ExtractionPanel({
  panelWidth,
  filteredFields,
  selectedField,
  inputRefs,
  rowRefs,
  handleFieldUpdate,
  imageUrl,
  currentFieldBox,
  onFieldSelect,
  onSave,
  submitting
}: ExtractionPanelProps) {
  const [previewPosition, setPreviewPosition] = useState<{
    top: number;
    left: number;
    position: 'top' | 'bottom';
  } | null>(null);

  const [debugInfo, setDebugInfo] = useState({
    lastAction: '',
    selectedField,
    hasPreviewPosition: !!previewPosition,
    currentFieldBox: !!currentFieldBox,
    imageUrl: imageUrl || 'null',
    blobType: imageUrl?.startsWith('blob:') ? 'blob' : 'not blob'
  });

  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      selectedField,
      hasPreviewPosition: !!previewPosition,
      currentFieldBox: !!currentFieldBox,
      imageUrl: imageUrl || 'null',
      blobType: imageUrl?.startsWith('blob:') ? 'blob' : 'not blob'
    }));
  }, [selectedField, previewPosition, currentFieldBox, imageUrl]);

  useEffect(() => {
    if (selectedField !== null) {
      showPreview(parseInt(selectedField));
    } else {
      setPreviewPosition(null);
    }
  }, [selectedField]);

  const handleRowClick = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    onFieldSelect(index);
    
    setTimeout(() => {
      const input = inputRefs.current[index.toString()];
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const handleInputFocus = (index: number, event: React.FocusEvent<HTMLInputElement>) => {
    event.preventDefault();
    
    if (selectedField !== index.toString()) {
      onFieldSelect(index);
    }
  };

  const showPreview = (index: number) => {
    const row = rowRefs.current[index.toString()];
    if (!row) return;

    const rowRect = row.getBoundingClientRect();
    const previewHeight = 150;
    const previewWidth = 300;
    const padding = 16;

    const spaceAbove = rowRect.top;
    const spaceBelow = window.innerHeight - rowRect.bottom;

    const position = spaceAbove > (previewHeight + padding) ? 'top' : 'bottom';
    
    const top = position === 'top'
      ? Math.max(padding, rowRect.top - previewHeight - padding)
      : Math.min(window.innerHeight - previewHeight - padding, rowRect.bottom + padding);

    const tableRect = row.closest('table')?.getBoundingClientRect();
    const idealLeft = tableRect 
      ? tableRect.left + (tableRect.width - previewWidth) / 2
      : Math.max(padding, Math.min(rowRect.left, window.innerWidth - previewWidth - padding));
      
    const left = Math.max(padding, Math.min(idealLeft, window.innerWidth - previewWidth - padding));

    setPreviewPosition({ top, left, position });
  };

  const handleCheckboxClick = (e: React.MouseEvent, index: number, isChecked: boolean) => {
    e.stopPropagation();
    onFieldSelect(index);
    handleFieldUpdate(index, !isChecked);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedField) return;
      
      const currentIndex = parseInt(selectedField);
      const maxIndex = filteredFields.length - 1;
      
      if (e.key === 'ArrowDown' && currentIndex < maxIndex) {
        onFieldSelect(currentIndex + 1);
        
        setTimeout(() => {
          const input = inputRefs.current[(currentIndex + 1).toString()];
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
        
        e.preventDefault();
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        onFieldSelect(currentIndex - 1);
        
        setTimeout(() => {
          const input = inputRefs.current[(currentIndex - 1).toString()];
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
        
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, filteredFields.length, onFieldSelect, inputRefs]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.8) return 'text-yellow-600 bg-yellow-50';
    return 'text-accent-600 bg-accent-50';
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Field Validation
          </h2>
          <Button 
            onClick={onSave} 
            size="sm"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="p-2 bg-yellow-50 border-b border-yellow-200 text-xs">
          <div><strong>Debug:</strong> {debugInfo.lastAction}</div>
          <div>
            Selected: {debugInfo.selectedField || 'none'} | 
            Preview: {debugInfo.hasPreviewPosition ? 'yes' : 'no'} | 
            Box: {debugInfo.currentFieldBox ? 'yes' : 'no'}
          </div>
          <div className="break-all">
            Image URL: {debugInfo.imageUrl}
          </div>
          <div>
            Blob type: {debugInfo.blobType}
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-[40%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th scope="col" className="w-[45%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFields.map(({ field, index }) => {
                const content = typeof field.value?.content === 'string' 
                  ? field.value.content 
                  : '';
                
                const keyContent = typeof field.key === 'object' && field.key !== null
                  ? field.key.content || 'Unnamed Field'
                  : field.key || 'Unnamed Field';
                
                const isCheckbox = content.includes(':selected:') || content.includes(':unselected:');
                const isChecked = content.includes(':selected:');
                const isSelected = selectedField === index.toString();
                
                return (
                  <tr
                    key={index}
                    ref={(el) => rowRefs.current[index.toString()] = el}
                    className={cn(
                      'hover:bg-gray-50 cursor-pointer',
                      isSelected && 'bg-primary-50'
                    )}
                    onClick={(e) => handleRowClick(index, e)}
                    tabIndex={-1}
                  >
                    <td className="px-4 py-3 text-xs font-medium text-gray-900 align-top">
                      <div className="break-words">{keyContent}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {isCheckbox ? (
                        <div className="flex items-center h-8 px-3">
                          <div 
                            role="checkbox"
                            aria-checked={isChecked}
                            tabIndex={0}
                            className={cn(
                              "focus:outline-none focus:ring-2 focus:ring-primary-500 rounded",
                              "cursor-pointer"
                            )}
                            onClick={(e) => handleCheckboxClick(e, index, isChecked)}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                onFieldSelect(index);
                                handleFieldUpdate(index, !isChecked);
                              }
                            }}
                            onFocus={() => {
                              onFieldSelect(index);
                            }}
                          >
                            <Checkbox
                              checked={isChecked}
                              tabIndex={-1}
                              className="pointer-events-none"
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            ref={(el) => inputRefs.current[index.toString()] = el}
                            value={content}
                            onChange={(e) => handleFieldUpdate(index, e.target.value)}
                            onFocus={(e) => handleInputFocus(index, e)}
                            placeholder="No value"
                            className={cn(
                              "h-8",
                              !content && "text-gray-400 placeholder:text-gray-400"
                            )}
                            onClick={(e) => e.stopPropagation()}
                            disabled={submitting}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm align-top">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getConfidenceColor(field.confidence || 0)
                        }`}>
                          {Math.round((field.confidence || 0) * 100)}%
                        </span>
                        {(field.confidence || 0) < 0.9 && (
                          <AlertCircle className="h-4 w-4 ml-2 text-yellow-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ExcerptPortal
        isVisible={!!selectedField && !!previewPosition}
        imageUrl={imageUrl}
        boundingBox={currentFieldBox}
        position={previewPosition}
      />
    </>
  );
}