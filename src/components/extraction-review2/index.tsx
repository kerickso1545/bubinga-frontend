import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { getDocument, getConfig, getDocumentPage, getDocumentPages } from '../../lib/api';
import { Exception, Config, configSchema } from '../../lib/types';
import { cn } from '../../lib/utils';
import { ExtractionPanel } from './ExtractionPanel';
import { DocumentReviewLayout } from '../document-review-layout';
import { useAuthStore } from '../../lib/store';

export function ExtractionReview2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [document, setDocument] = useState<Exception | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(1.0);
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageBlobs, setPageBlobs] = useState<Record<number, Blob>>({});
  const [submitting, setSubmitting] = useState(false);
  const extractionContainerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const { user, preferences, markExtractionVisited } = useAuthStore();

  const docId = searchParams.get('doc_id');

  useEffect(() => {
    if (!preferences.hasVisitedExtraction) {
      markExtractionVisited();
      // Select first field on first visit
      if (document?.metadata?.extracted_data?.length > 0) {
        setSelectedField('0');
      }
    }
  }, [preferences.hasVisitedExtraction, markExtractionVisited, document]);

  useEffect(() => {
    async function loadData() {
      try {
        if (!docId) {
          setError('No document identifier provided');
          setLoading(false);
          return;
        }

        const [docData, configData, pages] = await Promise.all([
          getDocument(docId),
          getConfig(),
          getDocumentPages(docId)
        ]);

        setDocument(docData);
        const parsedConfig = configSchema.parse(configData);
        setConfig(parsedConfig);
        setTotalPages(pages);

        const extractionConfig = parsedConfig.workflow_steps?.find(step => step.name === 'extraction');
        if (extractionConfig?.threshold) {
          setConfidenceThreshold(extractionConfig.threshold);
        }
        
        await loadPage(1);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document data');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (pageUrl) {
        URL.revokeObjectURL(pageUrl);
      }
    };
  }, [docId]);

  const loadPage = async (pageNumber: number) => {
    if (!docId) return;

    try {
      if (pageBlobs[pageNumber]) {
        const url = URL.createObjectURL(pageBlobs[pageNumber]);
        if (pageUrl) {
          URL.revokeObjectURL(pageUrl);
        }
        setPageUrl(url);
        return;
      }

      const pageBlob = await getDocumentPage(docId, pageNumber);
      setPageBlobs(prev => ({
        ...prev,
        [pageNumber]: pageBlob
      }));
      
      const url = URL.createObjectURL(pageBlob);
      if (pageUrl) {
        URL.revokeObjectURL(pageUrl);
      }
      setPageUrl(url);
    } catch (err) {
      console.error(`Failed to load page ${pageNumber}:`, err);
      setError(`Failed to load page ${pageNumber}. Please try again.`);
    }
  };

  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage, docId]);

  const handleFieldUpdate = (index: number, newValue: string | boolean) => {
    if (!document?.metadata?.extracted_data) return;
    
    const updatedData = [...document.metadata.extracted_data];
    const currentField = updatedData[index];
    
    if (typeof currentField.value?.content === 'string' && 
        (currentField.value.content.includes(':selected:') || 
         currentField.value.content.includes(':unselected:'))) {
      const newContent = newValue === true ? ':selected:' : ':unselected:';
      
      updatedData[index] = {
        ...currentField,
        value: { 
          ...currentField.value,
          content: newContent
        }
      };
    } else {
      updatedData[index] = {
        ...currentField,
        value: { 
          ...currentField.value,
          content: newValue as string
        }
      };
    }
    
    setDocument(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        extracted_data: updatedData
      }
    } : null);
  };

  const handleSave = async () => {
    if (!document || !user?.email || submitting || !docId) return;

    try {
      setSubmitting(true);
      setError(null);

      const ocrUpdates = {
        ocr_data: {
          key_value_pairs: document.metadata.extracted_data.map(field => ({
            key: typeof field.key === 'object' ? field.key.content || '' : field.key || '',
            value: typeof field.value === 'object' ? field.value.content || '' : field.value || '',
            confidence: 1.0
          }))
        }
      };

      const ocrResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/document/updateocrdata?doc_id=${encodeURIComponent(docId)}`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ocrUpdates)
        }
      );

      if (!ocrResponse.ok) {
        throw new Error(`Failed to update OCR data: ${await ocrResponse.text()}`);
      }

      const updateData = {
        status: 'processed',
        audit_log: {
          timestamp: new Date().toISOString(),
          step: 'extraction',
          action: 'manual_review_completed',
          user: user.email,
          details: {
            corrected_fields: document.metadata.extracted_data.map(field => ({
              key: typeof field.key === 'object' ? field.key.content || '' : field.key || '',
              value: typeof field.value === 'object' ? field.value.content || '' : field.value || ''
            }))
          }
        }
      };

      const updateResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/document/update-with-audit?doc_id=${encodeURIComponent(docId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Failed to update metadata: ${await updateResponse.text()}`);
      }

      const removePointerResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/document/pointer/remove?doc_id=${encodeURIComponent(docId)}&queue=extraction/exceptions`,
        { method: 'DELETE' }
      );

      if (!removePointerResponse.ok) {
        throw new Error(`Failed to remove pointer: ${await removePointerResponse.text()}`);
      }

      const moveResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/document/move-to-step?doc_id=${encodeURIComponent(docId)}&step=export`,
        { method: 'POST' }
      );

      if (!moveResponse.ok) {
        throw new Error(`Failed to move document: ${await moveResponse.text()}`);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save extraction data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldSelect = (index: number) => {
    const field = document?.metadata?.extracted_data?.[index];
    if (field) {
      const pageNumber = field.value?.boundingRegions?.[0]?.pageNumber || 
                        field.key?.boundingRegions?.[0]?.pageNumber || 
                        currentPage;
      
      if (pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
      }
    }
    
    setSelectedField(prev => {
      const newValue = prev === index.toString() ? null : index.toString();
      return newValue;
    });
    
    setTimeout(() => {
      const input = inputRefs.current[index.toString()];
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const filteredFields = useMemo(() => {
    if (!document?.metadata?.extracted_data) return [];

    return document.metadata.extracted_data
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => {
        if (showLowConfidenceOnly) {
          return (field.confidence || 0) < 0.9;
        }
        return true;
      });
  }, [document?.metadata?.extracted_data, showLowConfidenceOnly]);

  const boundingBoxes = useMemo(() => {
    return filteredFields.map(({ field, index }) => {
      if (!field?.value?.boundingRegions?.[0]?.percentage_coords) {
        return {
          id: index.toString(),
          box: {
            page: 1,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
          },
          confidence: field.confidence || 0,
          isActive: index.toString() === selectedField
        };
      }

      const region = field.value.boundingRegions[0];
      const coords = region.percentage_coords;
      
      return {
        id: index.toString(),
        box: {
          page: region.pageNumber || 1,
          top: coords.top_left?.[1] || 0,
          left: coords.top_left?.[0] || 0,
          bottom: coords.bottom_right?.[1] || 0,
          right: coords.bottom_right?.[0] || 0
        },
        confidence: field.confidence || 0,
        isActive: index.toString() === selectedField
      };
    });
  }, [filteredFields, selectedField]);

  const currentFieldBox = useMemo(() => {
    if (!selectedField || !document?.metadata?.extracted_data) return null;
    
    const field = document.metadata.extracted_data[parseInt(selectedField)];
    if (!field) return null;

    const hasValue = field.value?.content && field.value.content !== '';
    
    if (hasValue && field?.value?.boundingRegions?.[0]?.percentage_coords) {
      const coords = field.value.boundingRegions[0].percentage_coords;
      return {
        top: coords.top_left?.[1] || 0,
        left: coords.top_left?.[0] || 0,
        bottom: coords.bottom_right?.[1] || 0,
        right: coords.bottom_right?.[0] || 0
      };
    }
    
    if (field?.key?.boundingRegions?.[0]?.percentage_coords) {
      const coords = field.key.boundingRegions[0].percentage_coords;
      return {
        top: coords.top_left?.[1] || 0,
        left: coords.top_left?.[0] || 0,
        bottom: coords.bottom_right?.[1] || 0,
        right: coords.bottom_right?.[0] || 0
      };
    }

    return null;
  }, [selectedField, document?.metadata?.extracted_data]);

  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
      className={cn(showLowConfidenceOnly && 'bg-primary-50')}
    >
      <Filter className="h-4 w-4 mr-2" />
      {showLowConfidenceOnly ? 'Show All' : 'Low Confidence Only'}
    </Button>
  );

  return (
    <DocumentReviewLayout
      title="Field Review"
      loading={loading}
      error={error}
      pageUrl={pageUrl}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      boundingBoxes={boundingBoxes}
      onBoundingBoxClick={(id) => handleFieldSelect(parseInt(id))}
      rightPanel={
        <ExtractionPanel 
          panelWidth={panelWidth}
          filteredFields={filteredFields}
          selectedField={selectedField}
          inputRefs={inputRefs}
          rowRefs={rowRefs}
          handleFieldUpdate={handleFieldUpdate}
          imageUrl={pageUrl}
          currentFieldBox={currentFieldBox}
          onFieldSelect={handleFieldSelect}
          onSave={handleSave}
          submitting={submitting}
        />
      }
      actionButtons={actionButtons}
    />
  );
}