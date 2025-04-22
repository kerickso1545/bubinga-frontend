import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDocument, getConfig, getDocumentPage, getDocumentPages } from '../../lib/api';
import { Exception, Config, configSchema } from '../../lib/types';
import { DocumentReviewLayout } from '../document-review-layout';
import { ClassificationPanel } from './ClassificationPanel';
import { useAuthStore } from '../../lib/store';

export function ClassificationReview2() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Exception | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageBlobs, setPageBlobs] = useState<Record<number, Blob>>({});
  const [submitting, setSubmitting] = useState(false);
  const { user, preferences, markClassificationVisited } = useAuthStore();

  const docId = searchParams.get('doc_id');

  useEffect(() => {
    if (!preferences.hasVisitedClassification) {
      markClassificationVisited();
    }
  }, [preferences.hasVisitedClassification, markClassificationVisited]);

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
        
        const initialDocType = docData.metadata?.classifications?.[0]?.doc_type;
        if (initialDocType) {
          setSelectedDocType(initialDocType);
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

  const handleConfirmClassification = async () => {
    if (!document || !user?.email || submitting || !docId) return;

    try {
      setSubmitting(true);
      setError(null);

      const previousClassification = document.metadata?.classifications?.[0];
      const updateData = {
        document_type: selectedDocType,
        status: 'processed',
        classification_source: user.email,
        confidence: 1.0,
        audit_log: {
          timestamp: new Date().toISOString(),
          step: 'classification',
          action: 'manual_review_completed',
          user: user.email,
          details: {
            previous_type: previousClassification?.doc_type || 'unknown',
            new_type: selectedDocType,
            confidence: 1.0,
            previous_confidence: previousClassification?.confidence || 0,
            previous_source: previousClassification?.source || 'unknown'
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
        throw new Error(`Failed to update classification: ${await updateResponse.text()}`);
      }

      const removePointerResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/document/pointer/remove?doc_id=${encodeURIComponent(docId)}&queue=classification/exceptions`, 
        { method: 'DELETE' }
      );

      if (!removePointerResponse.ok) {
        throw new Error(`Failed to remove pointer: ${await removePointerResponse.text()}`);
      }

      const moveResponse = await fetch(
        `${import.meta.env.VITE_API_BASE}/document/move-to-step?doc_id=${encodeURIComponent(docId)}&step=extraction`,
        { method: 'POST' }
      );

      if (!moveResponse.ok) {
        throw new Error(`Failed to move document: ${await moveResponse.text()}`);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to submit classification:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit classification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const classification = document?.metadata?.classifications?.[0];
  const confidenceValue = classification?.confidence ?? 0;
  const currentDocType = classification?.doc_type ?? 'Unknown';

  return (
    <DocumentReviewLayout
      title="Document Type Review"
      loading={loading}
      error={error}
      pageUrl={pageUrl}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      rightPanel={
        config && (
          <ClassificationPanel
            config={config}
            currentDocType={currentDocType}
            confidenceValue={confidenceValue}
            routingReason={document?.metadata?.routing_reason}
            selectedDocType={selectedDocType}
            setSelectedDocType={setSelectedDocType}
            onConfirmClassification={handleConfirmClassification}
            submitting={submitting}
            isFirstVisit={!preferences.hasVisitedClassification}
          />
        )
      }
    />
  );
}