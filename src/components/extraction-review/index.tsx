import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { DocumentViewer } from '../document-viewer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getDocument, getConfig } from '../../lib/api';
import { Exception, Config, configSchema } from '../../lib/types';
import { decodeDocId } from '../../lib/utils';

interface ExtractionField {
  key: string;
  value: string;
  confidence: number;
  boundingBox: {
    page: number;
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
}

export function ExtractionReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Exception | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<ExtractionField[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState<string | null>(null);

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
        
        // Transform API extraction data into fields
        if (docData.metadata?.extractions) {
          const extractedFields = Object.entries(docData.metadata.extractions).map(([key, data]) => ({
            key,
            value: data.value || '',
            confidence: data.confidence || 0,
            boundingBox: {
              page: data.page || 1,
              // Convert coordinate pairs to percentages
              top: data.coordinates[0][1],    // First pair y
              left: data.coordinates[0][0],   // First pair x
              bottom: data.coordinates[1][1],  // Second pair y
              right: data.coordinates[1][0],   // Second pair x
            }
          }));
          setFields(extractedFields);
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

  const handleFieldUpdate = (key: string, value: string) => {
    setFields(prev => prev.map(field => 
      field.key === key ? { ...field, value } : field
    ));
  };

  const handleSave = async () => {
    // TODO: Implement API call to save field updates
    console.log('Saving updated fields:', fields);
  };

  const handleFieldSelect = (key: string) => {
    setSelectedField(key);
    const field = fields.find(f => f.key === key);
    if (field) {
      setCurrentPage(field.boundingBox.page);
    }
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.8) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get current page's fields for bounding boxes
  const currentPageFields = fields.filter(f => f.boundingBox.page === currentPage);
  const boundingBoxes = selectedField ? {
    [currentPage]: [{
      id: selectedField,
      box: fields.find(f => f.key === selectedField)?.boundingBox || { top: 0, left: 0, bottom: 0, right: 0 }
    }]
  } : {
    [currentPage]: currentPageFields.map(field => ({
      id: field.key,
      box: field.boundingBox
    }))
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
                Field Review
              </h1>
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <div className="flex-1 bg-white rounded-lg shadow">
            <DocumentViewer
              filePath={document.path}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              boundingBoxes={boundingBoxes}
            />
          </div>
          
          <div className="w-96 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                Field Validation
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Review and correct extracted field values
              </p>
            </div>
            
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field) => (
                    <tr
                      key={field.key}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedField === field.key ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleFieldSelect(field.key)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {field.key}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <Input
                          value={field.value}
                          onChange={(e) => handleFieldUpdate(field.key, e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getConfidenceColor(field.confidence)
                          }`}>
                            {Math.round(field.confidence * 100)}%
                          </span>
                          {field.confidence < 0.9 && (
                            <AlertCircle className="h-4 w-4 ml-2 text-yellow-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}