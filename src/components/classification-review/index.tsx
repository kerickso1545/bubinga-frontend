import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { DocumentViewer } from '../document-viewer';
import { Button } from '../ui/button';
import { getDocument, getConfig } from '../../lib/api';
import { Exception, Config, configSchema } from '../../lib/types';
import { decodeDocId } from '../../lib/utils';

export function ClassificationReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Exception | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const docId = searchParams.get('doc_id');
        const filePath = searchParams.get('file_path');
        
        let path: string;
        if (docId) {
          path = decodeDocId(docId);
        } else if (filePath) {
          path = filePath;
        } else {
          setError('No document identifier provided');
          setLoading(false);
          return;
        }

        const [docData, configData] = await Promise.all([
          getDocument(path),
          getConfig(),
        ]);
        setDocument(docData);
        const parsedConfig = configSchema.parse(configData);
        setConfig(parsedConfig);
        
        // Set initial selected document type
        const initialDocType = docData.metadata?.classifications?.[0]?.doc_type;
        if (initialDocType) {
          setSelectedDocType(initialDocType);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load document data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchParams]);

  const handleConfirmClassification = async () => {
    // TODO: Implement API call to confirm classification
    console.log('Confirming classification:', selectedDocType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !document || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Document not found'}</div>
      </div>
    );
  }

  const classification = document.metadata?.classifications?.[0];
  const confidenceValue = classification?.confidence ?? 0;
  const currentDocType = classification?.doc_type ?? 'Unknown';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Document Type Review
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <div className="flex-1 bg-white rounded-lg shadow">
            <DocumentViewer
              filePath={document.path}
              onPageChange={(page) => console.log('Page changed:', page)}
            />
          </div>
          
          <div className="w-80 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Document Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Classification
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentDocType}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confidence
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      confidenceValue < 0.9
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {(confidenceValue * 100).toFixed(2)}%
                  </div>
                  <span className="text-sm text-gray-500">
                    {confidenceValue < 0.9 ? 'Low' : 'High'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {document.metadata?.routing_reason || 'Classification confidence level'}
                </p>
              </div>

              <div>
                <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-2">
                  Classify Document
                </label>
                <select
                  id="docType"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select document type...</option>
                  {config.document_types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {selectedDocType && (
                  <p className="mt-2 text-sm text-gray-500">
                    {config.document_types.find(t => t.id === selectedDocType)?.description}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={handleConfirmClassification}
                  disabled={!selectedDocType}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Classification
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}