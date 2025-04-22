import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Exception } from '../../lib/types';
import { ExceptionQueue } from './exception-queue';
import { getExceptions } from '../../lib/api';
import { 
  Loader2, 
  ChevronDown, 
  ChevronRight
} from 'lucide-react';
import { encodeDocId, cn } from '../../lib/utils';
import { useLayoutStore, useExceptionCountStore } from '../../lib/store';
import { LeftMenu } from '../shared/LeftMenu';

export function Dashboard() {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    classification: true,
    extraction: true
  });
  
  // Use the shared toolbar state
  const { isToolbarExpanded } = useLayoutStore();
  
  // Get the exception count store to update counts
  const { fetchCounts } = useExceptionCountStore();

  useEffect(() => {
    async function fetchExceptions() {
      try {
        const data = await getExceptions();
        setExceptions(data);
        
        // Update the counts in the store when we get new data
        fetchCounts();
      } catch (err) {
        setError('Failed to load exceptions');
        console.error('Error fetching exceptions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExceptions();
  }, [fetchCounts]);

  const handleExceptionSelect = (exception: Exception) => {
    const match = exception.path.match(/processes[/\\].+/);
    if (match) {
      const relativePath = match[0].replace(/\\/g, '/');
      const docId = encodeDocId(relativePath);
      
      if (exception.step === 'classification') {
        navigate(`/classification2?doc_id=${docId}`);
      } else if (exception.step === 'extraction') {
        navigate(`/extraction2?doc_id=${docId}`);
      }
    }
  };

  const toggleSection = (section: 'classification' | 'extraction') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const classificationExceptions = exceptions.filter(e => e.step === 'classification');
  const extractionExceptions = exceptions.filter(e => e.step === 'extraction');

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-accent-600">{error}</div>
      </div>
    );
  }

  return (
    <div id="mainContainer" className="fixed inset-0">
      <div id="topBar" className="fixed top-0 left-0 right-0 bg-[#eef5ff] shadow-sm z-50 h-12">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Document Review Queue
          </h1>
          <div id="viewerTopToolbar" className="flex items-center space-x-2">
            {/* Empty placeholder for future user/settings content */}
          </div>
        </div>
      </div>

      <LeftMenu />

      <div 
        id="exceptionQueuePanel" 
        className="fixed top-12 bottom-0 overflow-auto transition-all duration-300 bg-[#f1f7ff]"
        style={{ 
          left: isToolbarExpanded ? '12rem' : '3rem',
          right: 0
        }}
      >
        <div className="p-6">
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {/* Classification Section */}
            <div className="p-4">
              <button
                onClick={() => toggleSection('classification')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.classification ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  Document Type Issues ({classificationExceptions.length})
                </h2>
              </button>
              {expandedSections.classification && (
                <div className="mt-4">
                  {classificationExceptions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No document type issues
                    </div>
                  ) : (
                    <ExceptionQueue
                      title="Document Type Issues"
                      exceptions={classificationExceptions}
                      onSelect={handleExceptionSelect}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Extraction Section */}
            <div className="p-4">
              <button
                onClick={() => toggleSection('extraction')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.extraction ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  Field Issues ({extractionExceptions.length})
                </h2>
              </button>
              {expandedSections.extraction && (
                <div className="mt-4">
                  {extractionExceptions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No field issues
                    </div>
                  ) : (
                    <ExceptionQueue
                      title="Field Issues"
                      exceptions={extractionExceptions}
                      onSelect={handleExceptionSelect}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}